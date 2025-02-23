import OpenAI from 'openai';
import axios from 'axios';
import { MetadataResult } from '../types/metadata';

interface Author {
  firstName: string;
  lastName: string;
  affiliation: string;
}

interface ArticleMetadata {
  pmid?: string;
  doi?: string;
  title: string;
  authors: Author[];
  journal: string;
  publicationYear?: number;
  abstract?: string;
  keywords?: string[];
  citations?: number;
}

interface PubMedArticle {
  uid: string;
  pubdate: string;
  authors: Array<{
    name: string;
    authtype: string;
    clusterid: string;
    affiliations?: string[];
  }>;
  title: string;
  fulljournalname: string;
  volume: string;
  issue: string;
  pages: string;
  elocationid: string;
  doi: string;
  abstract?: string;
}

interface CrossrefWork {
  DOI: string;
  title: Array<string>;
  author: Array<{
    given: string;
    family: string;
    affiliation: Array<{ name: string }>;
  }>;
  'container-title': Array<string>;
  published: {
    'date-parts': Array<Array<number>>;
  };
  abstract: string;
  'is-referenced-by-count': number;
}

export class MetadataService {
  private static readonly PUBMED_API_KEY = process.env.PUBMED_API_KEY;
  private static readonly PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  private static readonly CROSSREF_BASE_URL = 'https://api.crossref.org/works';
  private static readonly MODEL = "gpt-4o";

  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  private static extractDOIFromText(text: string): string | null {
    const doiRegex = /(10\.\d{4,9}\/[^\s"'<>]+)/i;
    const match = text.match(doiRegex);
    if (match && match[1]) {
      console.log("Raw DOI match:", match[1]);
      // Remove any trailing '/full...' if present.
      let doi = match[1].trim();
      doi = doi.replace(/\/full.*$/i, "");
      console.log("Cleaned DOI:", doi);
      return doi;
    }
    console.warn("No valid DOI found in the provided text.");
    return null;
  }

  private static extractPMIDFromText(text: string): string | null {
    const pmidRegex = /PMID:\s*(\d+)/i;
    const match = text.match(pmidRegex);
    return match ? match[1] : null;
  }

  private static extractTitleFromText(text: string): string | null {
    // Look for title patterns in the first 1000 characters
    const firstPart = text.substring(0, 1000);
    
    // Common title patterns
    const patterns = [
      /^Title:\s*(.+?)(?=\n|$)/i,
      /^(.+?)\n\s*(?:Abstract|Introduction|Background)/i,
      /^\s*(.{20,150}?)\s*(?:\n|$)/  // First line between 20-150 chars
    ];

    for (const pattern of patterns) {
      const match = firstPart.match(pattern);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }

    return null;
  }

  private static extractAbstractFromText(text: string): string | null {
    const abstractPatterns = [
      /Abstract[:\s]+([^]+?)(?=\n\s*(?:Introduction|Background|Methods|Results|Discussion|Conclusion|Keywords|$))/i,
      /Summary[:\s]+([^]+?)(?=\n\s*(?:Introduction|Background|Methods|Results|Discussion|Conclusion|Keywords|$))/i
    ];

    for (const pattern of abstractPatterns) {
      const match = text.match(pattern);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }

    return null;
  }

  private static extractKeywordsFromText(text: string): string[] {
    const keywordPatterns = [
      /Keywords?[:\s]+((?:[^,\n]+,\s*)*[^,\n]+)/i,
      /Key\s+words?[:\s]+((?:[^,\n]+,\s*)*[^,\n]+)/i
    ];

    for (const pattern of keywordPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].split(',').map(k => k.trim()).filter(k => k.length > 0);
      }
    }

    return [];
  }

  private static extractAuthorsFromText(text: string): string[] {
    // Look for author patterns in the first 2000 characters
    const firstPart = text.substring(0, 2000);
    
    const authorPatterns = [
      /Authors?[:\s]+(.+?)(?=\n\s*(?:Abstract|Introduction|Background|Affiliations?|$))/i,
      /By[:\s]+(.+?)(?=\n\s*(?:Abstract|Introduction|Background|Affiliations?|$))/i
    ];

    for (const pattern of authorPatterns) {
      const match = firstPart.match(pattern);
      if (match && match[1]) {
        // Split by common author separators and clean up
        return match[1]
          .split(/[,;&]|\sand\s/)
          .map(author => author.trim())
          .filter(author => author.length > 0 && /[A-Za-z]/.test(author));
      }
    }

    return [];
  }

  private static async searchCrossrefByTitle(title: string): Promise<any> {
    try {
      const encodedTitle = encodeURIComponent(title);
      const response = await axios.get(`${this.CROSSREF_BASE_URL}?query.bibliographic=${encodedTitle}`);
      
      if (response.data?.message?.items?.length > 0) {
        return response.data.message.items[0];
      }
    } catch (error) {
      console.warn('Crossref search error:', (error as Error).message);
    }
    return null;
  }

  private static async searchPubMedByTitle(title: string): Promise<any> {
    try {
      const encodedTitle = encodeURIComponent(title);
      const searchResponse = await axios.get(
        `${this.PUBMED_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodedTitle}&retmode=json`
      );

      if (searchResponse.data?.esearchresult?.idlist?.[0]) {
        const id = searchResponse.data.esearchresult.idlist[0];
        const summaryResponse = await axios.get(
          `${this.PUBMED_BASE_URL}/esummary.fcgi?db=pubmed&id=${id}&retmode=json`
        );

        return summaryResponse.data?.result?.[id];
      }
    } catch (error) {
      console.warn('PubMed search error:', error.message);
    }
    return null;
  }

  private static async extractMetadataWithAI(text: string): Promise<Partial<MetadataResult>> {
    try {
      // Only use first 4000 characters for AI analysis to avoid token limits
      const textSample = text.substring(0, 4000);
      
      const completion = await this.openai.chat.completions.create({
        model: this.MODEL,
        messages: [
          {
            role: "system",
            content: "Extract metadata from the academic paper text. Return a JSON object with title, abstract, authors (array), keywords (array), doi, and pmid."
          },
          {
            role: "user",
            content: textSample
          }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      return {
        title: result.title,
        abstract: result.abstract,
        authors: result.authors || [],
        keywords: result.keywords || [],
        doi: result.doi,
        pmid: result.pmid
      };
    } catch (error) {
      console.error('AI metadata extraction error:', error);
      return {};
    }
  }

  private static async searchCrossrefByDOI(doi: string): Promise<any> {
    try {
      const response = await axios.get(`${this.CROSSREF_BASE_URL}/${encodeURIComponent(doi)}`);
      if (response.data?.message) {
        console.log("Crossref DOI search produced metadata:", response.data.message);
        return response.data.message;
      }
    } catch (error) {
      console.warn("Crossref DOI search error:", error.message);
    }
    return null;
  }

  // Add a helper to strip HTML/XML tags
  private static stripTags(text: string): string {
    return text.replace(/<[^>]*>/g, "").trim();
  }

  public static async getMetadata(text: string): Promise<MetadataResult> {
    console.log('=== Starting Metadata Extraction ===');
    
    if (text.startsWith("%PDF")) {
      try {
        const pdfParse = (await import("pdf-parse")).default;
        console.log("Detected PDF content. Parsing with pdf-parse...");
        // Create a Buffer using 'binary' encoding.
        const buffer = Buffer.from(text, "binary");
        console.log("Buffer hex preview:", buffer.toString('hex', 0, 60));
        const pdfData = await pdfParse(buffer);
        console.log("PDF parsed successfully. Extracted text length:", pdfData.text.length);
        // Split the parsed text into words and log the first 1000 words
        const words = pdfData.text.split(/\s+/);
        const snippet = words.slice(0, 1000).join(" ");
        console.log("Parsed text snippet (first 1000 words):", snippet);
        text = pdfData.text;
      } catch (err) {
        console.error("Error parsing PDF text:", err);
      }
    } else {
      console.log("Text does not appear to be raw PDF. Using provided text.");
    }

    // Initialize result object
    const result: MetadataResult = {
      title: null,
      abstract: null,
      keywords: [],
      authors: [],
      doi: null,
      pmid: null,
      hasTitle: false,
      hasAbstract: false,
      keywordCount: 0,
      authorCount: 0,
      hasDOI: false,
      hasPMID: false
    };

    try {
      // Step 1: Traditional text extraction
      console.log('Extracting metadata using traditional methods...');
      result.title = this.extractTitleFromText(text);
      result.abstract = this.extractAbstractFromText(text);
      result.keywords = this.extractKeywordsFromText(text);
      result.authors = this.extractAuthorsFromText(text);
      result.doi = this.extractDOIFromText(text);
      result.pmid = this.extractPMIDFromText(text);

      // Step 2: If we have a title, try API lookups
      if (result.title) {
        console.log('Searching external APIs with title...');
        const [pubmedData, crossrefData] = await Promise.all([
          this.searchPubMedByTitle(result.title!),
          this.searchCrossrefByTitle(result.title!)
        ]);

        // Merge PubMed data if available
        if (pubmedData) {
          result.pmid = result.pmid || pubmedData.uid;
          result.authors = result.authors.length ? result.authors : 
            (pubmedData.authors?.map((a: any) => ({
              name: a.name,
              affiliation: "" // adjust if affiliation info is available
            })) || []);
        }

        // Merge Crossref data if available
        if (crossrefData) {
          result.doi = result.doi || crossrefData.DOI;
          result.title = result.title || crossrefData.title?.[0];
          result.authors = result.authors.length ? result.authors :
            (crossrefData.author?.map((a: any) => ({
              name: `${a.given} ${a.family}`.trim(),
              affiliation: a.affiliation && a.affiliation.length > 0 ? a.affiliation[0].name : ""
            })) || []);
          result.journal = crossrefData['container-title']?.[0] || '';
          result.publicationYear = crossrefData.published?.['date-parts']?.[0]?.[0] || 
                                 crossrefData['published-online']?.['date-parts']?.[0]?.[0] ||
                                 null;
        }
      }

      // If key metadata is missing but we have a valid DOI, query Crossref using the DOI:
      if (result.doi && (!result.title || !result.abstract || !result.authors.length)) {
        console.log("Searching external APIs with DOI...");
        const crossrefDOIData = await this.searchCrossrefByDOI(result.doi!);
        if (crossrefDOIData) {
          result.title = result.title || crossrefDOIData.title?.[0];
          result.abstract = result.abstract || crossrefDOIData.abstract;
          result.authors = result.authors.length ? result.authors :
            (crossrefDOIData.author?.map((a: any) => ({
              name: `${a.given} ${a.family}`.trim(),
              affiliation: a.affiliation && a.affiliation.length > 0 ? a.affiliation[0].name : ""
            })) || []);
          result.keywords = result.keywords.length ? result.keywords :
            (crossrefDOIData['container-title'] || []);
        }
      }

      // Clean the abstract by stripping any JATS or XML tags
      if (result.abstract) {
        result.abstract = this.stripTags(result.abstract);
      }

      // Update metadata presence flags
      result.hasTitle = !!result.title;
      result.hasAbstract = !!result.abstract;
      result.keywordCount = result.keywords.length;
      result.authorCount = result.authors.length;
      result.hasDOI = !!result.doi;
      result.hasPMID = !!result.pmid;

      console.log('Author data structure:', {
        count: result.authorCount,
        firstAuthor: result.authors[0],
        sampleAuthors: result.authors.slice(0, 3)
      });

      console.log('Final metadata extraction results:', {
        hasTitle: result.hasTitle,
        hasAbstract: result.hasAbstract,
        keywordCount: result.keywordCount,
        authorCount: result.authorCount,
        hasDOI: result.hasDOI,
        hasPMID: result.hasPMID
      });

    } catch (error) {
      console.error('Error during metadata extraction:', error);
    }

    return result;
  }
} 
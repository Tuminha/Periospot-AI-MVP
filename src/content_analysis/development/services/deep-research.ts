import OpenAI from 'openai';
import { z } from 'zod';
import pLimit from 'p-limit';
import axios from 'axios';
import { OutputManager } from '../utils/output-manager';
import { 
  ConceptResponse, 
  SearchResult as ISearchResult, 
  ResearchProgress as IResearchProgress, 
  DeepResearchResult,
  ResearchConcept as IResearchConcept 
} from './types/research';

export type ResearchProgress = IResearchProgress;
export type SearchResult = ISearchResult;
export type ResearchConcept = IResearchConcept;

interface DeepResearchOptions {
  depth?: number;
  breadth?: number;
  selectedTopics?: string[];
  onProgress?: (progress: ResearchProgress) => void;
}

export class DeepResearchService {
  private openai: OpenAI;
  private limit: ReturnType<typeof pLimit>;
  private outputManager: OutputManager;
  private static CONCURRENCY_LIMIT = 3;
  private static MODEL = "gpt-4o";
  private static PUBMED_API_KEY = process.env.PUBMED_API_KEY;
  private static PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.limit = pLimit(DeepResearchService.CONCURRENCY_LIMIT);
    this.outputManager = new OutputManager();
  }

  private logStep(step: string, details: any) {
    const formattedLog = {
      timestamp: new Date().toISOString(),
      step,
      details,
      metadata: {
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };

    console.log('\n==========================================================');
    console.log(`STEP: ${step}`);
    console.log('----------------------------------------------------------');
    console.log('Details:', JSON.stringify(details, null, 2));
    console.log('Metadata:', JSON.stringify(formattedLog.metadata, null, 2));
    console.log('==========================================================\n');

    // Log to console only since OutputManager might not support emit
    console.log('[Analysis Log]', formattedLog);
  }

  private async searchPubMed(query: string): Promise<SearchResult[]> {
    try {
      this.logStep('PubMed Search Start', {
        query,
        timestamp: new Date().toISOString(),
        searchParams: {
          database: 'pubmed',
          maxResults: 5,
          dateRange: '2019:2024'
        }
      });

      // First search for IDs
      const searchUrl = `${DeepResearchService.PUBMED_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=5&format=json&api_key=${DeepResearchService.PUBMED_API_KEY}`;
      this.logStep('PubMed Search URL Construction', {
        baseUrl: DeepResearchService.PUBMED_BASE_URL,
        endpoint: 'esearch.fcgi',
        parameters: {
          db: 'pubmed',
          term: query,
          retmax: 5,
          format: 'json'
        }
      });
      
      const searchResponse = await axios.get(searchUrl);
      this.logStep('PubMed Search Response', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        headers: searchResponse.headers,
        idCount: searchResponse.data.esearchresult.count,
        ids: searchResponse.data.esearchresult.idlist,
        timing: {
          requestStartTime: new Date().toISOString()
        }
      });

      const ids = searchResponse.data.esearchresult.idlist;
      if (!ids || ids.length === 0) {
        this.logStep('PubMed Search Result', {
          status: 'No results found',
          query
        });
        return [];
      }

      // Get full article details including abstract using efetch
      const fetchUrl = `${DeepResearchService.PUBMED_BASE_URL}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&rettype=abstract&retmode=xml&api_key=${DeepResearchService.PUBMED_API_KEY}`;
      this.logStep('PubMed Fetch Abstract URL', { url: fetchUrl });
      
      const fetchResponse = await axios.get(fetchUrl);
      this.logStep('PubMed Abstract Fetch', {
        status: 'Success',
        dataLength: fetchResponse.data.length
      });

      // Check PMC availability for full text
      const pmcUrl = `${DeepResearchService.PUBMED_BASE_URL}/elink.fcgi?dbfrom=pubmed&db=pmc&linkname=pubmed_pmc&id=${ids.join(',')}&retmode=json&api_key=${DeepResearchService.PUBMED_API_KEY}`;
      this.logStep('PMC Full Text Check URL', { url: pmcUrl });
      
      const pmcResponse = await axios.get(pmcUrl);
      const pmcData = pmcResponse.data.linksets[0];
      const pmcIds = pmcData?.linksetdbs?.[0]?.links || [];
      
      this.logStep('PMC Availability Check', {
        availableFullTexts: pmcIds.length,
        pmcIds
      });

      // Get basic metadata
      const summaryUrl = `${DeepResearchService.PUBMED_BASE_URL}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&format=json&api_key=${DeepResearchService.PUBMED_API_KEY}`;
      this.logStep('PubMed Summary URL', { url: summaryUrl });
      
      const summaryResponse = await axios.get(summaryUrl);
      this.logStep('PubMed Summary Data', {
        articleCount: Object.keys(summaryResponse.data.result).length - 1 // Subtract 1 for 'uids' key
      });

      const results = summaryResponse.data.result;
      const processedResults = await Promise.all(ids.map(async (id: string) => {
        const article = results[id];
        let fullText = '';
        
        // If article is available in PMC, get full text
        const pmcId = pmcIds.find((link: any) => link.id);
        if (pmcId) {
          try {
            const fullTextUrl = `${DeepResearchService.PUBMED_BASE_URL}/efetch.fcgi?db=pmc&id=${pmcId.id}&rettype=text&retmode=text&api_key=${DeepResearchService.PUBMED_API_KEY}`;
            this.logStep('PMC Full Text Fetch Attempt', {
              pmcId: pmcId.id,
              url: fullTextUrl
            });
            
            const fullTextResponse = await axios.get(fullTextUrl);
            fullText = fullTextResponse.data;
            this.logStep('PMC Full Text Retrieved', {
              pmcId: pmcId.id,
              textLength: fullText.length
            });
          } catch (error) {
            this.logStep('PMC Full Text Fetch Error', {
              pmcId: pmcId.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        // Extract abstract from XML response
        const abstractMatch = fetchResponse.data.match(new RegExp(`<PubmedArticle>.*?<PMID>${id}</PMID>.*?<Abstract>(.*?)</Abstract>`, 's'));
        const abstract = abstractMatch ? 
          abstractMatch[1]
            .replace(/<\/?AbstractText[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim() 
          : article.abstract || '';

        const processedArticle = {
          title: article.title,
          abstract,
          fullText: fullText || null,
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          pmcUrl: pmcId ? `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId.id}/` : null,
          date: article.pubdate,
          journal: article.fulljournalname,
          authors: article.authors?.map((author: any) => author.name) || [],
          isFullTextAvailable: Boolean(pmcId)
        };

        this.logStep('Processed Article', {
          id,
          title: processedArticle.title,
          hasAbstract: Boolean(processedArticle.abstract),
          hasFullText: processedArticle.isFullTextAvailable,
          authorCount: processedArticle.authors.length
        });

        return processedArticle;
      }));

      this.logStep('PubMed Search Complete', {
        query,
        resultsFound: processedResults.length,
        fullTextAvailable: processedResults.filter(r => r.isFullTextAvailable).length
      });

      this.logStep('PMC Full Text Processing', {
        totalArticles: ids.length,
        fullTextAvailable: pmcIds.length,
        conversionStats: {
          success: processedResults.filter(r => r.isFullTextAvailable).length,
          failed: processedResults.filter(r => !r.isFullTextAvailable).length
        }
      });

      return processedResults;
    } catch (error) {
      this.logStep('PubMed Search Error', {
        query,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      return [];
    }
  }

  private async extractKeyConcepts(text: string): Promise<ResearchConcept[]> {
    try {
      this.logStep('GPT Concept Extraction Start', {
        inputLength: text.length,
        timestamp: new Date().toISOString(),
        model: DeepResearchService.MODEL,
        parameters: {
          temperature: 0.2,
          responseFormat: 'json_object'
        }
      });

      const response = await this.openai.chat.completions.create({
        model: DeepResearchService.MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "You are a dental research expert specializing in periodontics and evidence-based dentistry. Extract key concepts from dental research papers and return them in JSON format with a 'concepts' array. Each concept should have: main_claim (string), methodology (object with study_design and details), statistical_evidence (object with tests and results), and clinical_implications (string)."
          },
          {
            role: "user",
            content: `Extract key concepts from this dental research text and return them in JSON format with a 'concepts' array. For each concept include the main claim, methodology, statistical evidence, and clinical implications:\n\n${text}`
          }
        ],
        response_format: { type: "json_object" }
      });

      this.logStep('GPT Response Analysis', {
        model: DeepResearchService.MODEL,
        completion: {
          id: response.id,
          created: response.created,
          model: response.model,
          choices: response.choices.map(choice => ({
            finishReason: choice.finish_reason,
            contentLength: choice.message.content?.length || 0
          })),
          usage: response.usage
        }
      });

      const content = response.choices[0].message.content || '{"concepts": []}';
      const parsed = JSON.parse(content) as ConceptResponse;

      this.logStep('Concept Extraction Results', {
        conceptCount: parsed.concepts.length,
        concepts: parsed.concepts.map(concept => ({
          claim: concept.main_claim,
          methodologyType: concept.methodology.study_design,
          hasStatistics: Boolean(concept.statistical_evidence.tests),
          implicationLength: concept.clinical_implications.length
        }))
      });

      return parsed.concepts;
    } catch (error) {
      this.logStep('GPT Concept Extraction Error', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : 'Unknown error',
        timestamp: new Date().toISOString(),
        model: DeepResearchService.MODEL
      });
      return [];
    }
  }

  private async generateSearchQueries(concepts: ResearchConcept[]): Promise<string[]> {
    try {
      this.logStep('Query Generation Start', {
        conceptCount: concepts.length,
        timestamp: new Date().toISOString()
      });

      const response = await this.openai.chat.completions.create({
        model: DeepResearchService.MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "You are a dental research expert. Generate academic search queries for validating dental research concepts. Return them in JSON format with a 'queries' array containing strings formatted for academic databases (e.g., PubMed, Cochrane) with proper operators and date ranges."
          },
          {
            role: "user",
            content: `Generate academic search queries to validate these research concepts and return them in JSON format with a 'queries' array. Format the queries for academic databases with proper operators and date ranges (2019..2024):\n\n${JSON.stringify(concepts)}`
          }
        ],
        response_format: { type: "json_object" }
      });

      this.logStep('GPT Query Generation Response', {
        responseContent: response.choices[0].message.content,
        model: DeepResearchService.MODEL,
        finishReason: response.choices[0].finish_reason
      });

      const content = response.choices[0].message.content || '{"queries": []}';
      const parsed = JSON.parse(content) as { queries: string[] };

      this.logStep('Generated Queries', {
        queryCount: parsed.queries.length,
        queries: parsed.queries
      });

      return parsed.queries;
    } catch (error) {
      this.logStep('Query Generation Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      return [
        "dental implants primary stability evidence 2019..2024",
        "finite element analysis dental implants 2019..2024",
        "bone density implant stability correlation 2019..2024"
      ];
    }
  }

  private async processSearchResults(concepts: ResearchConcept[], searchResults: SearchResult[]): Promise<DeepResearchResult> {
    try {
      this.logStep('Results Processing Start', {
        conceptCount: concepts.length,
        resultCount: searchResults.length,
        timestamp: new Date().toISOString()
      });

      // Prepare a comprehensive list of references
      const references = searchResults.map(result => {
        const authors = result.authors && result.authors.length > 0 
          ? `${result.authors[0]}${result.authors.length > 1 ? ' et al.' : ''}`
          : 'Unknown authors';
        
        return `${authors}. ${result.title}. ${result.journal || 'Unknown journal'}. ${new Date(result.date).getFullYear()}. ${result.isFullTextAvailable ? `Full text available at: ${result.pmcUrl}` : `Abstract available at: ${result.url}`}`;
      });

      this.logStep('Generated References', {
        referenceCount: references.length,
        references
      });

      const response = await this.openai.chat.completions.create({
        model: DeepResearchService.MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "You are a dental research expert. Analyze research concepts and search results to provide a comprehensive analysis. For each claim validation and finding, cite the specific papers from the search results that support it. Return the analysis in JSON format with: validatedClaims (array of {claim, sources, validationScore}), relatedFindings (array of {finding, source, relevanceScore}), clinicalImplications (string[]), researchGaps (string[]), confidenceScore (number)."
          },
          {
            role: "user",
            content: `Analyze these concepts and search results and provide a comprehensive analysis in JSON format. Include validated claims with sources and scores, related findings with relevance scores, clinical implications, research gaps, and overall confidence score. For each claim and finding, reference the specific papers that support it:\n\nConcepts: ${JSON.stringify(concepts)}\n\nSearch Results: ${JSON.stringify(searchResults)}`
          }
        ],
        response_format: { type: "json_object" }
      });

      this.logStep('GPT Analysis Response', {
        responseContent: response.choices[0].message.content,
        model: DeepResearchService.MODEL,
        finishReason: response.choices[0].finish_reason
      });

      const content = response.choices[0].message.content || '{}';
      const analysis = JSON.parse(content);

      this.logStep('Final Analysis', {
        validatedClaimsCount: analysis.validatedClaims?.length || 0,
        relatedFindingsCount: analysis.relatedFindings?.length || 0,
        clinicalImplicationsCount: analysis.clinicalImplications?.length || 0,
        researchGapsCount: analysis.researchGaps?.length || 0,
        confidenceScore: analysis.confidenceScore || 0
      });

      return {
        ...analysis,
        concepts,
        searchResults,
        references
      } as DeepResearchResult;
    } catch (error) {
      this.logStep('Results Processing Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      return {
        concepts,
        searchResults,
        validatedClaims: [],
        relatedFindings: [],
        clinicalImplications: [],
        researchGaps: [],
        confidenceScore: 0,
        references: searchResults.map(result => `${result.authors?.[0] || 'Unknown'} et al. ${result.title}. ${result.journal || 'Unknown journal'}. ${new Date(result.date).getFullYear()}.`)
      };
    }
  }

  public async analyzeWithDeepResearch(text: string, options: DeepResearchOptions = {}): Promise<DeepResearchResult> {
    const { depth = 2, breadth = 3, selectedTopics = [], onProgress } = options;

    this.logStep('Deep Research Analysis Start', {
      textLength: text.length,
      depth,
      breadth,
      timestamp: new Date().toISOString()
    });

    const concepts = await this.extractKeyConcepts(text);
    
    // Filter concepts based on selected topics if provided
    const filteredConcepts = selectedTopics.length > 0 
      ? concepts.filter(concept => 
          selectedTopics.some(topic => 
            concept.main_claim.toLowerCase().includes(topic.toLowerCase()) ||
            concept.clinical_implications.toLowerCase().includes(topic.toLowerCase())
          )
        )
      : concepts;

    const searchResults: SearchResult[] = [];
    const progress: ResearchProgress = {
      currentDepth: 0,
      totalDepth: depth,
      currentBreadth: 0,
      totalBreadth: breadth,
      totalQueries: depth * breadth * filteredConcepts.length,
      completedQueries: 0
    };

    this.logStep('Analysis Progress Initialized', progress);

    for (const concept of filteredConcepts) {
      this.logStep('Processing Concept', {
        concept,
        timestamp: new Date().toISOString()
      });

      const queries = await this.generateSearchQueries([concept]);
      
      for (const query of queries) {
        progress.completedQueries++;
        if (onProgress) {
          onProgress(progress);
        }
        
        const results = await this.searchPubMed(query);
        if (results.length > 0) {
          searchResults.push(...results);
        }
      }
    }

    this.logStep('All Queries Processed', {
      totalResults: searchResults.length,
      timestamp: new Date().toISOString()
    });

    return this.processSearchResults(filteredConcepts, searchResults);
  }
} 
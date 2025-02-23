import { ArticleMetadata, Author } from '@/types/article';

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

// Helper to parse author name into first and last name
function parseAuthorName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.split(' ');
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1]
  };
}

// Search PubMed by DOI
async function searchPubMedByDOI(doi: string): Promise<ArticleMetadata | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_PUBMED_API_KEY;
    console.log('🔑 Using PubMed API key:', apiKey ? 'Present' : 'Missing');
    
    if (!apiKey) {
      console.warn('⚠️ PubMed API key not found in environment variables');
      return null;
    }

    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(doi)}[doi]&api_key=${apiKey}&retmode=json`;
    console.log('🔍 PubMed search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      console.error('❌ PubMed search failed:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText
      });
      return null;
    }

    const searchData = await searchResponse.json();
    console.log('📄 PubMed search results:', searchData);
    
    if (!searchData.esearchresult.idlist?.length) {
      console.log('ℹ️ No PubMed results found for DOI:', doi);
      return null;
    }

    return await getPubMedDetails(searchData.esearchresult.idlist[0]);
  } catch (error) {
    console.error('❌ PubMed DOI search error:', error);
    return null;
  }
}

// Search PubMed by PMID
async function searchPubMedByPMID(pmid: string): Promise<ArticleMetadata | null> {
  try {
    return await getPubMedDetails(pmid);
  } catch (error) {
    console.error('PubMed PMID search error:', error);
    return null;
  }
}

// Get PubMed article details
async function getPubMedDetails(pmid: string): Promise<ArticleMetadata | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_PUBMED_API_KEY;
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&api_key=${apiKey}&retmode=json`;
    const summaryResponse = await fetch(summaryUrl);
    const summaryData = await summaryResponse.json();
    
    const article = summaryData.result[pmid] as PubMedArticle;
    
    // Parse authors with affiliations
    const authors: Author[] = article.authors.map(author => {
      const { firstName, lastName } = parseAuthorName(author.name);
      return {
        firstName,
        lastName,
        affiliation: author.affiliations?.[0] || ''
      };
    });

    // Extract year from pubdate
    const publicationYear = parseInt(article.pubdate.split(' ')[0]);

    return {
      pmid: article.uid,
      doi: article.doi || undefined,
      title: article.title,
      authors,
      journal: article.fulljournalname,
      publicationYear: isNaN(publicationYear) ? undefined : publicationYear,
      abstract: article.abstract
    };
  } catch (error) {
    console.error('PubMed details error:', error);
    return null;
  }
}

// Search PubMed by title
async function searchPubMedByTitle(title: string): Promise<ArticleMetadata | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_PUBMED_API_KEY;
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(title)}&api_key=${apiKey}&retmode=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.esearchresult.idlist?.length) {
      return null;
    }

    return await getPubMedDetails(searchData.esearchresult.idlist[0]);
  } catch (error) {
    console.error('PubMed title search error:', error);
    return null;
  }
}

// Search Crossref by DOI
async function searchCrossrefByDOI(doi: string): Promise<ArticleMetadata | null> {
  try {
    const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Periospot AI (mailto:your-email@example.com)'
      }
    });
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const work = data.message as CrossrefWork;
    
    const authors: Author[] = work.author?.map(author => ({
      firstName: author.given,
      lastName: author.family,
      affiliation: author.affiliation?.[0]?.name
    })) || [];

    return {
      doi: work.DOI,
      title: work.title[0],
      authors,
      journal: work['container-title']?.[0],
      publicationYear: work.published?.['date-parts']?.[0]?.[0],
      citations: work['is-referenced-by-count'],
      abstract: work.abstract
    };
  } catch (error) {
    console.error('Crossref DOI search error:', error);
    return null;
  }
}

// Search Crossref by title
async function searchCrossrefByTitle(title: string): Promise<ArticleMetadata | null> {
  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(title)}&rows=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Periospot AI (mailto:your-email@example.com)'
      }
    });
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.message.items?.length) {
      return null;
    }

    const work = data.message.items[0] as CrossrefWork;
    
    const authors: Author[] = work.author?.map(author => ({
      firstName: author.given,
      lastName: author.family,
      affiliation: author.affiliation?.[0]?.name
    })) || [];

    return {
      doi: work.DOI,
      title: work.title[0],
      authors,
      journal: work['container-title']?.[0],
      publicationYear: work.published?.['date-parts']?.[0]?.[0],
      citations: work['is-referenced-by-count'],
      abstract: work.abstract
    };
  } catch (error) {
    console.error('Crossref title search error:', error);
    return null;
  }
}

// Main function to get metadata from all sources
export async function getScientificMetadata(
  params: { title?: string; doi?: string; pmid?: string }
): Promise<ArticleMetadata | null> {
  // Try PubMed with PMID first if available
  if (params.pmid) {
    const pubmedData = await searchPubMedByPMID(params.pmid);
    if (pubmedData) {
      return pubmedData;
    }
  }

  // Try searching by DOI in both PubMed and Crossref if available
  if (params.doi) {
    const pubmedData = await searchPubMedByDOI(params.doi);
    if (pubmedData) {
      return pubmedData;
    }

    const crossrefData = await searchCrossrefByDOI(params.doi);
    if (crossrefData) {
      return crossrefData;
    }
  }

  // Try searching by title if available
  if (params.title) {
    // Try PubMed first (best for medical/dental research)
    const pubmedData = await searchPubMedByTitle(params.title);
    if (pubmedData) {
      return pubmedData;
    }

    // Try Crossref if PubMed fails
    const crossrefData = await searchCrossrefByTitle(params.title);
    if (crossrefData) {
      return crossrefData;
    }
  }

  return null;
} 
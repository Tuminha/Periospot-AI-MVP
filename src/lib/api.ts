import axios from 'axios';
import { supabase } from './supabase';
import { ArticleMetadata, Author } from '@/types/article';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Initialize axios instance
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  timeout: 30000 // 30 seconds
});

// Add request/response interceptors for better error handling and logging
api.interceptors.request.use(
  async (config) => {
    const requestId = Math.random().toString(36).substring(7);

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        config.headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      console.log(`🌐 API Request [${requestId}]:`, {
        method: config.method,
        url: config.url,
        headers: {
          ...config.headers,
          Authorization: config.headers['Authorization'] ? 'Bearer [hidden]' : undefined
        },
        data: config.data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error getting auth session:', error);
    }

    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', {
      message: error.message,
      config: error.config,
      timestamp: new Date().toISOString()
    });
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: {
        ...response.headers,
        Authorization: undefined
      },
      timestamp: new Date().toISOString()
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      message: error.message,
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers ? {
          ...error.response.headers,
          Authorization: undefined
        } : undefined
      },
      timestamp: new Date().toISOString()
    });

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

// Scientific Database Interfaces
interface PubMedArticle {
  uid: string;
  pubdate: string;
  authors: Array<{
    name: string;
    authtype: string;
    clusterid: string;
  }>;
  title: string;
  fulljournalname: string;
  volume: string;
  issue: string;
  pages: string;
  elocationid: string;
  doi: string;
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

interface SemanticScholarAuthor {
  name: string;
  given?: string;
  family?: string;
  affiliation?: string;
}

// Helper Functions
function parseAuthorName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.split(' ');
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1]
  };
}

// Scientific Database API Functions
export async function searchPubMed(title: string): Promise<ArticleMetadata | null> {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(title)}&retmode=json`;
    const { data: searchData } = await api.get(searchUrl);
    
    if (!searchData.esearchresult.idlist?.length) {
      return null;
    }

    const id = searchData.esearchresult.idlist[0];
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${id}&retmode=json`;
    const { data: summaryData } = await api.get(summaryUrl);
    
    const article = summaryData.result[id] as PubMedArticle;
    const authors: Author[] = article.authors.map(author => {
      const { firstName, lastName } = parseAuthorName(author.name);
      return { firstName, lastName, affiliation: '' };
    });

    const publicationYear = parseInt(article.pubdate.split(' ')[0]);

    return {
      pmid: article.uid,
      doi: article.doi || undefined,
      title: article.title,
      authors,
      journal: article.fulljournalname,
      publicationYear: isNaN(publicationYear) ? undefined : publicationYear
    };
  } catch (error) {
    console.error('PubMed search error:', error);
    return null;
  }
}

export async function searchCrossref(title: string): Promise<ArticleMetadata | null> {
  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(title)}&rows=1`;
    const { data } = await api.get(url, {
      headers: {
        'User-Agent': 'Periospot AI (mailto:your-email@example.com)'
      }
    });
    
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
    console.error('Crossref search error:', error);
    return null;
  }
}

export async function searchSemanticScholar(title: string): Promise<ArticleMetadata | null> {
  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(title)}&fields=title,authors,year,journal,abstract,citationCount,influentialCitationCount`;
    const { data } = await api.get(url);

    if (!data.data?.[0]) {
      return null;
    }

    const paper = data.data[0];
    
    return {
      title: paper.title,
      authors: paper.authors?.map((author: SemanticScholarAuthor) => ({
        firstName: author.given || '',
        lastName: author.family || author.name,
        affiliation: author.affiliation
      })),
      journal: paper.journal?.name,
      publicationYear: paper.year,
      abstract: paper.abstract,
      citations: paper.citationCount
    };
  } catch (error) {
    console.error('Semantic Scholar search error:', error);
    return null;
  }
}

// Main metadata function
export async function getScientificMetadata(title: string): Promise<ArticleMetadata | null> {
  // Try PubMed first (best for medical/dental research)
  const pubmedData = await searchPubMed(title);
  if (pubmedData) {
    return pubmedData;
  }

  // Try Crossref if PubMed fails
  const crossrefData = await searchCrossref(title);
  if (crossrefData) {
    return crossrefData;
  }

  // Try Semantic Scholar as last resort
  const semanticScholarData = await searchSemanticScholar(title);
  if (semanticScholarData) {
    return semanticScholarData;
  }

  return null;
}

// File Upload Functions
export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    console.log('Starting file upload:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      endpoint: `${API_URL}/analysis/upload`
    });

    const response = await api.post('/analysis/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded));
        console.log('Upload progress:', percentCompleted, '%');
      }
    });

    console.log('Upload successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Upload failed:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

export async function validateStatistics(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/analysis/validate-statistics', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
}

export async function checkReferences(file: File, references: string[]) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('references', JSON.stringify(references));

  const response = await api.post('/analysis/check-references', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
}

export async function getUserAnalytics(userId: string) {
  const response = await api.get('/user/analytics', {
    headers: {
      'x-user-id': userId
    }
  });

  return response.data;
}

export async function getUserHistory(userId: string) {
  const response = await api.get('/user/history', {
    headers: {
      'x-user-id': userId
    }
  });

  return response.data;
} 
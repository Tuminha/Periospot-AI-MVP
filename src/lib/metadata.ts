import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { ArticleMetadata } from '@/types/article';
import { getScientificMetadata } from './api/scientific-databases';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  const worker = new Worker(new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url));
  pdfjsLib.GlobalWorkerOptions.workerPort = worker;
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';

    // Get first 5 pages for metadata extraction
    const maxPages = Math.min(pdf.numPages, 5);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }

    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF file');
  }
}

async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX file');
  }
}

async function extractMetadataWithAI(text: string): Promise<ArticleMetadata> {
  try {
    const response = await fetch('/api/analyze/metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text.substring(0, 4000) }),
    });

    if (!response.ok) {
      throw new Error('Failed to extract metadata using AI');
    }

    return await response.json();
  } catch (error) {
    console.error('Error extracting metadata with AI:', error);
    throw new Error('Failed to extract metadata using AI');
  }
}

async function extractIdentifiers(text: string): Promise<{ doi?: string; pmid?: string }> {
  const doiMatch = text.match(/\b(10\.\d{4,}(?:\.\d+)*\/\S+)\b/);
  const pmidMatch = text.match(/PMID:\s*(\d+)/i);

  return {
    doi: doiMatch?.[1],
    pmid: pmidMatch?.[1]
  };
}

async function extractTitleFromText(text: string): Promise<string> {
  try {
    const response = await fetch('/api/analyze/title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text.substring(0, 2000) }),
    });

    if (!response.ok) {
      throw new Error('Failed to extract title');
    }

    const data = await response.json();
    return data.title || '';
  } catch (error) {
    console.error('Error extracting title with AI:', error);
    return '';
  }
}

export async function extractMetadata(file: File): Promise<ArticleMetadata> {
  try {
    // Extract text based on file type
    let text: string;
    if (file.type === 'application/pdf') {
      text = await extractTextFromPDF(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await extractTextFromDOCX(file);
    } else {
      throw new Error('Unsupported file type');
    }

    // Extract DOI and PMID if present
    const identifiers = await extractIdentifiers(text);
    console.log('Extracted identifiers:', identifiers);

    // Try to find metadata using identifiers
    if (identifiers.doi || identifiers.pmid) {
      const scientificMetadata = await getScientificMetadata(identifiers);
      if (scientificMetadata) {
        console.log('Found metadata using identifiers:', scientificMetadata);
        return scientificMetadata;
      }
    }

    // Extract title if identifiers not found or no results
    const title = await extractTitleFromText(text);
    console.log('Extracted title:', title);

    // Try to find the paper by title
    if (title) {
      const scientificMetadata = await getScientificMetadata({ title });
      if (scientificMetadata) {
        console.log('Found metadata using title:', scientificMetadata);
        return scientificMetadata;
      }
    }

    // If not found in databases, use AI to extract metadata
    console.log('No match found in databases, using AI extraction');
    const aiMetadata = await extractMetadataWithAI(text);

    // Try scientific databases again with AI-extracted title if different
    if (aiMetadata.title && aiMetadata.title !== title) {
      const scientificMetadata = await getScientificMetadata({ 
        title: aiMetadata.title,
        doi: aiMetadata.doi,
        pmid: aiMetadata.pmid
      });
      if (scientificMetadata) {
        console.log('Found metadata in scientific databases using AI-extracted metadata:', scientificMetadata);
        return scientificMetadata;
      }
    }

    // Return AI-extracted metadata if no matches found
    return {
      ...aiMetadata,
      title: aiMetadata.title || title || file.name.replace(/\.[^/.]+$/, ""),
      publicationYear: aiMetadata.publicationYear || new Date().getFullYear(),
      authors: aiMetadata.authors || [{
        firstName: "Unknown",
        lastName: "Author",
        affiliation: "Not specified"
      }]
    };
  } catch (error) {
    console.error('Metadata extraction error:', error);
    // Return basic metadata if extraction fails
    return {
      title: file.name.replace(/\.[^/.]+$/, ""),
      authors: [{
        firstName: "Unknown",
        lastName: "Author",
        affiliation: "Not specified"
      }],
      journal: "Unknown",
      publicationYear: new Date().getFullYear()
    };
  }
} 
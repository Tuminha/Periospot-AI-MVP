import { describe, it, expect, vi } from 'vitest';
import { extractMetadata } from '@/lib/metadata';
import { searchPubMed, searchCrossref, searchSemanticScholar } from '@/lib/api';

// Mock the APIs
vi.mock('@/lib/api', () => ({
  searchPubMed: vi.fn(),
  searchCrossref: vi.fn(),
  searchSemanticScholar: vi.fn()
}));

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                title: "Test Article Title",
                authors: [{
                  firstName: "John",
                  lastName: "Doe",
                  affiliation: "Test University"
                }],
                journal: "Test Journal",
                publicationYear: 2024
              })
            }
          }]
        })
      }
    }
  }))
}));

describe('Metadata Extraction', () => {
  it('should extract metadata from PDF file', async () => {
    // Mock PDF file
    const file = new File(['test pdf content'], 'test.pdf', { type: 'application/pdf' });
    
    // Mock PubMed response
    const pubmedMetadata = {
      pmid: '12345',
      doi: '10.1234/test',
      title: 'Test Dental Research Paper',
      authors: [{
        firstName: 'Jane',
        lastName: 'Smith',
        affiliation: 'Dental University'
      }],
      journal: 'Journal of Dental Research',
      publicationYear: 2024
    };
    
    (searchPubMed as jest.Mock).mockResolvedValueOnce(pubmedMetadata);

    const result = await extractMetadata(file);
    
    expect(result).toEqual(pubmedMetadata);
    expect(searchPubMed).toHaveBeenCalled();
  });

  it('should fall back to Crossref if PubMed fails', async () => {
    const file = new File(['test pdf content'], 'test.pdf', { type: 'application/pdf' });
    
    // Mock PubMed failure and Crossref success
    (searchPubMed as jest.Mock).mockResolvedValueOnce(null);
    (searchCrossref as jest.Mock).mockResolvedValueOnce({
      doi: '10.1234/test',
      title: 'Test Paper',
      authors: [{
        firstName: 'John',
        lastName: 'Doe',
        affiliation: 'Test University'
      }],
      journal: 'Test Journal',
      publicationYear: 2024
    });

    const result = await extractMetadata(file);
    
    expect(result.doi).toBe('10.1234/test');
    expect(searchPubMed).toHaveBeenCalled();
    expect(searchCrossref).toHaveBeenCalled();
  });

  it('should handle unsupported file types', async () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    const result = await extractMetadata(file);
    
    expect(result).toEqual({
      title: 'test',
      authors: [{
        firstName: 'Unknown',
        lastName: 'Author',
        affiliation: 'Not specified'
      }],
      journal: 'Unknown',
      publicationYear: expect.any(Number)
    });
  });
}); 
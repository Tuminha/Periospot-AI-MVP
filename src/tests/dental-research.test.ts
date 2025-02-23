import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  analyzeDentalPaper,
  validateStatisticalMethods,
  assessPeriodontalRelevance,
  checkMethodologyQuality
} from '@/lib/analysis/dental-research';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  };
});

describe('Dental Research Analysis', () => {
  const mockText = `
    This randomized controlled trial evaluated the efficacy of scaling and root planing (SRP) 
    with adjunctive local minocycline in treating chronic periodontitis. 60 patients were randomly 
    assigned to test (SRP + minocycline) or control (SRP alone) groups. Clinical parameters 
    including probing depth (PD), clinical attachment level (CAL), and bleeding on probing (BOP) 
    were measured at baseline and 3 months. Statistical analysis used paired t-tests for within-group 
    comparisons and independent t-tests for between-group comparisons.
  `;

  const mockMetadata = {
    title: 'Efficacy of Local Minocycline as an Adjunct to Scaling and Root Planing',
    journal: 'Journal of Clinical Periodontology',
    publicationYear: 2023,
    authors: [],
    abstract: '',
    doi: '',
    pmid: '',
    citationCount: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeDentalPaper', () => {
    it('should analyze a dental research paper and return structured analysis', async () => {
      const mockResponse = {
        studyType: 'RCT',
        methodology: {
          type: 'Randomized Controlled Trial',
          description: 'Split-mouth design with control and test groups',
          concerns: ['No mention of examiner calibration']
        },
        statistics: {
          methods: ['Paired t-test', 'Independent t-test'],
          appropriateness: true,
          concerns: []
        },
        clinicalRelevance: {
          score: 8,
          explanation: 'Direct clinical application in periodontal practice',
          implications: ['Improved treatment outcomes with adjunctive therapy']
        },
        evidenceLevel: {
          level: '1B',
          description: 'Individual randomized controlled trial'
        },
        perio: {
          relevantConditions: ['Chronic periodontitis'],
          treatments: ['SRP', 'Local minocycline'],
          outcomes: ['PD reduction', 'CAL gain', 'BOP reduction']
        }
      };

      vi.mocked(OpenAI.prototype.chat.completions.create).mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }]
      } as any);

      const result = await analyzeDentalPaper(mockText, mockMetadata);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('validateStatisticalMethods', () => {
    it('should validate statistical methods and return structured feedback', async () => {
      const mockResponse = {
        isValid: true,
        concerns: ['No power calculation reported'],
        suggestions: ['Include sample size calculation', 'Consider multiple testing correction']
      };

      vi.mocked(OpenAI.prototype.chat.completions.create).mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }]
      } as any);

      const result = await validateStatisticalMethods(mockText);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('assessPeriodontalRelevance', () => {
    it('should assess periodontal relevance and return structured feedback', async () => {
      const mockResponse = {
        relevanceScore: 9,
        conditions: ['Chronic periodontitis'],
        clinicalImplications: ['Local minocycline improves SRP outcomes'],
        researchGaps: ['Long-term efficacy not assessed']
      };

      vi.mocked(OpenAI.prototype.chat.completions.create).mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }]
      } as any);

      const result = await assessPeriodontalRelevance(mockText);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('checkMethodologyQuality', () => {
    it('should evaluate methodology quality and return structured feedback', async () => {
      const mockResponse = {
        score: 8,
        strengths: ['Randomized design', 'Appropriate control group'],
        weaknesses: ['No examiner calibration reported'],
        recommendations: ['Include examiner calibration details']
      };

      vi.mocked(OpenAI.prototype.chat.completions.create).mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }]
      } as any);

      const result = await checkMethodologyQuality(mockText);
      expect(result).toEqual(mockResponse);
    });
  });
}); 
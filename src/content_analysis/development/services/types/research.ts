export interface ResearchConcept {
  main_claim: string;
  methodology: {
    study_design: string;
    details: string;
  };
  statistical_evidence: {
    tests: string;
    results: string;
  };
  clinical_implications: string;
}

export interface ConceptResponse {
  concepts: ResearchConcept[];
}

export interface SearchResult {
  title: string;
  abstract: string;
  fullText: string | null;
  url: string;
  pmcUrl: string | null;
  date: string;
  journal?: string;
  authors?: string[];
  isFullTextAvailable: boolean;
}

export interface ResearchProgress {
  currentDepth: number;
  totalDepth: number;
  currentBreadth: number;
  totalBreadth: number;
  currentQuery?: string;
  totalQueries: number;
  completedQueries: number;
  currentConcept?: string;
}

export interface DeepResearchResult {
  concepts: ResearchConcept[];
  searchResults: SearchResult[];
  validatedClaims: Array<{ claim: string; sources: string[]; validationScore: number }>;
  relatedFindings: Array<{ finding: string; source: string; relevanceScore: number }>;
  clinicalImplications: string[];
  researchGaps: string[];
  confidenceScore: number;
  references: string[];
} 
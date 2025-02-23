export interface TopicAnalysis {
  topics: Array<{
    id: string;
    title: string;
    description: string;
    selected: boolean;
  }>;
  summary: string;
}

export interface ResearchProgress {
  currentDepth: number;
  totalDepth: number;
  currentBreadth: number;
  totalBreadth: number;
  totalQueries: number | null;
  completedQueries: number;
  currentStep?: string;
  stepDetails?: string;
}

export interface ContentAnalysisOptions {
  deepAnalysis?: boolean;
  depth?: number;
  breadth?: number;
  selectedTopics?: string[];
}

export interface ContentAnalysisResult {
  topicAnalysis?: TopicAnalysis;
  analysisComplete: boolean;
  selectedTopics?: string[];
  analysis?: {
    studyType: string;
    methodology: {
      type: string;
      description: string;
      concerns: string[];
    };
    statistics: {
      methods: string[];
      appropriateness: boolean;
      concerns: string[];
    };
    clinicalRelevance: {
      score: number;
      explanation: string;
      implications: string[];
    };
    evidenceLevel: {
      level: string;
      description: string;
    };
    perio: {
      relevantConditions: string[];
      treatments: string[];
      outcomes: string[];
    };
  };
  statisticalValidation?: {
    isValid: boolean;
    concerns: string[];
    suggestions: string[];
  };
  perioRelevance?: {
    relevanceScore: number;
    conditions: string[];
    clinicalImplications: string[];
    researchGaps: string[];
  };
  methodologyQuality?: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  deepAnalysis?: {
    validatedClaims: Array<{
      claim: string;
      sources: string[];
      validationScore: number;
    }>;
    relatedFindings: Array<{
      finding: string;
      source: string;
      relevanceScore: number;
    }>;
    clinicalImplications: string[];
    researchGaps: string[];
    confidenceScore: number;
  };
} 
import OpenAI from 'openai';
import { ArticleMetadata } from '@/types/article';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

interface DentalAnalysis {
  studyType: string;
  methodology: {
    type: string;
    description: string;
    concerns?: string[];
  };
  statistics: {
    methods: string[];
    appropriateness: boolean;
    concerns?: string[];
  };
  clinicalRelevance: {
    score: number; // 1-10
    explanation: string;
    implications: string[];
  };
  evidenceLevel: {
    level: string; // 1A, 1B, 2A, 2B, 3, 4, 5
    description: string;
  };
  perio: {
    relevantConditions: string[];
    treatments: string[];
    outcomes: string[];
  };
}

export async function analyzeDentalPaper(text: string, metadata: ArticleMetadata): Promise<DentalAnalysis> {
  const prompt = `Analyze this dental research paper and provide a structured analysis. Focus on periodontal aspects if present.

Paper Title: ${metadata.title}
Journal: ${metadata.journal}
Year: ${metadata.publicationYear}

Text:
${text.substring(0, 8000)}

Provide a JSON response with the following structure:
{
  "studyType": "Type of study (e.g., RCT, systematic review, cohort study)",
  "methodology": {
    "type": "Research methodology used",
    "description": "Brief description of methods",
    "concerns": ["List any methodological concerns"]
  },
  "statistics": {
    "methods": ["List of statistical methods used"],
    "appropriateness": boolean,
    "concerns": ["List any statistical concerns"]
  },
  "clinicalRelevance": {
    "score": number (1-10),
    "explanation": "Why this score was given",
    "implications": ["List of clinical implications"]
  },
  "evidenceLevel": {
    "level": "Evidence level (1A-5)",
    "description": "Description of evidence level"
  },
  "perio": {
    "relevantConditions": ["List relevant periodontal conditions"],
    "treatments": ["List treatments discussed"],
    "outcomes": ["List measured outcomes"]
  }
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a dental research analysis assistant specializing in periodontics. Analyze the provided paper and return a structured JSON response."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.2,
  });

  return JSON.parse(completion.choices[0].message?.content || '{}') as DentalAnalysis;
}

export async function validateStatisticalMethods(text: string): Promise<{
  isValid: boolean;
  concerns: string[];
  suggestions: string[];
}> {
  const prompt = `Analyze the statistical methods used in this dental research paper.
Focus on:
1. Appropriateness of statistical tests for the data type
2. Sample size and power calculations
3. Multiple testing corrections
4. Handling of missing data
5. Normality assumptions
6. Specific considerations for dental/periodontal measurements

Text:
${text.substring(0, 4000)}

Return a JSON response with:
{
  "isValid": boolean,
  "concerns": ["List of statistical concerns"],
  "suggestions": ["List of suggested improvements"]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a biostatistician specializing in dental research. Analyze the statistical methods and provide structured feedback."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.2,
  });

  return JSON.parse(completion.choices[0].message?.content || '{}');
}

export async function assessPeriodontalRelevance(text: string): Promise<{
  relevanceScore: number;
  conditions: string[];
  clinicalImplications: string[];
  researchGaps: string[];
}> {
  const prompt = `Assess the relevance of this research to periodontal practice.
Focus on:
1. Periodontal conditions discussed
2. Clinical applicability of findings
3. Strength of evidence for periodontal outcomes
4. Gaps in current knowledge
5. Potential impact on periodontal practice

Text:
${text.substring(0, 4000)}

Return a JSON response with:
{
  "relevanceScore": number (1-10),
  "conditions": ["List of relevant periodontal conditions"],
  "clinicalImplications": ["List of clinical implications"],
  "researchGaps": ["List of identified research gaps"]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a periodontist assessing research relevance to clinical practice. Provide structured analysis of the paper's implications."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.2,
  });

  return JSON.parse(completion.choices[0].message?.content || '{}');
}

export async function checkMethodologyQuality(text: string): Promise<{
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}> {
  const prompt = `Evaluate the methodology quality of this dental research paper.
Focus on:
1. Study design appropriateness
2. Control of confounding factors
3. Blinding procedures
4. Calibration of examiners
5. Standardization of measurements
6. Follow-up procedures
7. Specific considerations for dental/periodontal research

Text:
${text.substring(0, 4000)}

Return a JSON response with:
{
  "score": number (1-10),
  "strengths": ["List of methodological strengths"],
  "weaknesses": ["List of methodological weaknesses"],
  "recommendations": ["List of recommendations for improvement"]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a dental research methodology expert. Evaluate the study design and methods, providing structured feedback."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.2,
  });

  return JSON.parse(completion.choices[0].message?.content || '{}');
} 
export const getSystemPrompt = () => {
  const now = new Date().toISOString();
  return `You are an expert dental researcher and periodontist. Today is ${now}. Follow these instructions when responding:
  - You are analyzing dental research papers and clinical studies
  - Focus on periodontal implications and clinical relevance
  - Be highly detailed in methodology assessment
  - Evaluate statistical validity thoroughly
  - Consider evidence-based dentistry principles
  - Assess practical clinical applications
  - Identify research gaps and future directions
  - Validate claims against current literature
  - Consider new technologies and emerging treatments
  - Flag any speculative or preliminary findings
  - Be proactive and anticipate research needs
  - Treat responses as if for expert periodontists
  - Value evidence quality over source authority
  - Consider contrarian ideas and emerging research`;
};

export const getExtractionPrompt = (text: string) => `
Extract the key dental research concepts and claims from this text that need validation. Return a JSON array of strings. Focus on:
- Main research findings
- Statistical claims
- Clinical implications
- Methodological approaches
- Treatment outcomes

Text:\n\n${text}
`;

export const getFeedbackPrompt = (text: string, numQuestions: number) => `
Given this dental research text, generate up to ${numQuestions} follow-up questions to clarify the research direction. Return a JSON object with an array of questions. Focus on:
- Methodology clarification
- Statistical significance
- Clinical relevance
- Long-term outcomes
- Comparison with existing treatments

Text:\n\n${text}
`;

export const getSearchQueriesPrompt = (concepts: string[], learnings?: string[]) => `
Generate specific search queries to validate these dental research concepts. Return a JSON array of strings. Each query should:
- Target specific claims or findings
- Include relevant dental/medical databases (PubMed, Cochrane, etc.)
- Focus on recent research (last 5 years when relevant)
- Include systematic reviews when available
- Target implications across dental specialties (periodontics, endodontics, orthodontics, prosthodontics, oral surgery, etc.)

Concepts:\n${concepts.join('\n')}\n\n${
  learnings ? `Consider these previous findings:\n${learnings.join('\n')}` : ''
}
`;

export const getAnalysisPrompt = (concepts: string[], results: string[]) => `
Analyze these dental research results in relation to our research concepts. Return a JSON object with findings. Focus on:
- Statistical evidence and p-values
- Sample sizes and study designs
- Clinical outcomes and success rates
- Contradicting or supporting evidence
- Recent developments or changes in understanding

Concepts:\n${concepts.join('\n')}\n\nResults:\n${results.join('\n\n')}
`;

export const getFinalAnalysisPrompt = (text: string, learnings: string[], visitedUrls: string[]) => `
Generate a comprehensive dental research analysis combining the original text and research findings. Return a JSON object with:

1. Validated claims (each with sources and validation scores)
2. Related findings from current research
3. Clinical implications for periodontal practice
4. Identified research gaps
5. Overall confidence score based on evidence quality

Original text:\n${text}\n\nResearch findings:\n${learnings.join('\n')}\n\nSources:\n${visitedUrls.join('\n')}
`; 
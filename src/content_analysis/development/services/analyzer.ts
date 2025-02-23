import OpenAI from 'openai';
import { ContentAnalysisResult, ContentAnalysisOptions } from '../types';
import { DeepResearchService } from './deep-research';

interface StructureAnalysis {
  hasIntroduction: boolean;
  hasMethods: boolean;
  hasResults: boolean;
  hasDiscussion: boolean;
  score: number;
  suggestions: string[];
}

interface ClarityAnalysis {
  readabilityScore: number;
  technicalAccuracy: number;
  suggestions: string[];
}

interface QualityAnalysis {
  citationQuality: number;
  methodologyStrength: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

interface DeepAnalysis {
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
}

interface TopicAnalysis {
  topics: Array<{
    id: string;
    title: string;
    description: string;
    selected: boolean;
  }>;
  summary: string;
}

interface PaperMetadata {
  title?: string;
  authors?: string[];
  abstract?: string;
  keywords?: string[];
  sections?: {
    title: string;
    content: string;
  }[];
  summary?: string;
}

export class AnalyzerService {
  private static readonly ANALYSIS_PROMPT = `Analyze this dental research paper text section and return a JSON object with:
{
  "hasIntroduction": boolean,
  "hasMethods": boolean,
  "hasResults": boolean,
  "hasDiscussion": boolean,
  "score": number (0-100),
  "suggestions": string[]
}`;

  private static readonly DEEP_ANALYSIS_PROMPT = `Analyze this dental research paper section and return a JSON object with:
{
  "validatedClaims": [{"claim": string, "sources": string[], "validationScore": number}],
  "relatedFindings": [{"finding": string, "source": string, "relevanceScore": number}],
  "clinicalImplications": string[],
  "researchGaps": string[],
  "confidenceScore": number
}`;

  private static readonly SUMMARY_PROMPT = `As a dental research expert, provide a comprehensive summary (500-1000 words) of this dental research paper. Focus on:
1. The main research question and objectives
2. Key methodological approaches
3. Primary findings and their statistical significance
4. Clinical implications for dental practice
5. Study limitations and future research directions

Format the summary in clear paragraphs. Use professional academic language while maintaining readability.`;

  private readonly openai: OpenAI;
  private readonly deepResearch: DeepResearchService;
  private static readonly CHUNK_SIZE = 25000;
  private static readonly MODEL = "gpt-4-turbo-preview";

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.deepResearch = new DeepResearchService();
  }

  private chunkText(text: string): string[] {
    console.log('DEBUG: Starting text chunking');
    console.log(`DEBUG: Input text length: ${text.length} characters`);

    try {
      if (!text) {
        throw new Error('No text provided for chunking');
      }

      if (text.length > 5000000) { // 5MB limit
        throw new Error('Text is too large. Maximum size is 5MB.');
      }

      // Split text into paragraphs first
      const paragraphs = text.split(/\n\s*\n/);
      console.log(`DEBUG: Split text into ${paragraphs.length} paragraphs`);

      const chunks: string[] = [];
      let currentChunk = '';

      for (const paragraph of paragraphs) {
        // If adding this paragraph would exceed chunk size, save current chunk and start new one
        if (currentChunk.length + paragraph.length > AnalyzerService.CHUNK_SIZE) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
          }
          currentChunk = paragraph;
        } else {
          currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
        }
      }

      // Add the last chunk if it exists
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      if (chunks.length === 0) {
        throw new Error('Failed to create any valid chunks from the text');
      }

      console.log(`DEBUG: Created ${chunks.length} chunks`);
      chunks.forEach((chunk, i) => {
        console.log(`DEBUG: Chunk ${i + 1} length: ${chunk.length} characters`);
      });

      return chunks;
    } catch (error: Error | unknown) {
      console.error('ERROR in chunkText:', error);
      throw new Error(`Failed to chunk text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private cleanPDFText(text: string): string {
    // Remove PDF metadata and binary data
    const cleanedText = text
      // Remove PDF metadata markers
      .replace(/\d{10}\s+\d{5}\s+n\s*/g, '')
      // Remove binary data markers
      .replace(/\x00/g, '')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove empty lines
      .replace(/^\s*[\r\n]/gm, '')
      .trim();

    // Extract meaningful text sections
    const sections = cleanedText.split(/(?=(?:[A-Z][a-z]+\s+){2,})/);
    
    // Find the title (usually the first meaningful line)
    const titleMatch = text.match(/^([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Find the abstract (usually starts with "Abstract" or after authors)
    const abstractMatch = text.match(/Abstract[:\s]+([\s\S]+?)(?=\n\s*[A-Z][a-z]+\s|$)/i);
    const abstract = abstractMatch ? abstractMatch[1].trim() : '';
    
    // Find the introduction (usually starts with "Introduction" or "1.")
    const introMatch = text.match(/(?:Introduction|1\.)[:\s]+([\s\S]+?)(?=\n\s*[A-Z][a-z]+\s|$)/i);
    const introduction = introMatch ? introMatch[1].trim() : '';

    // Combine the important sections
    return [title, abstract, introduction].filter(Boolean).join('\n\n');
  }

  private async extractMetadata(text: string): Promise<PaperMetadata> {
    console.log('\n=== Extracting Paper Metadata ===');
    
    const metadata: PaperMetadata = {};
    
    // Extract title (usually first non-empty line)
    const titleMatch = text.match(/^(?:\s*\n)*([^\n]+)/);
    metadata.title = titleMatch ? titleMatch[1].trim() : undefined;
    console.log('Title:', metadata.title);

    // Extract abstract
    const abstractPattern = /(?:abstract|summary)[:.\s]+([^]*?)(?=\n\s*(?:introduction|keywords|1\.|background|methods|results))/i;
    const abstractMatch = text.match(abstractPattern);
    metadata.abstract = abstractMatch ? abstractMatch[1].trim() : undefined;
    console.log('Abstract length:', metadata.abstract?.length || 0);

    // Extract keywords
    const keywordsPattern = /(?:keywords|key\s+words)[:.\s]+([^]*?)(?=\n\s*(?:introduction|1\.|background|methods|results))/i;
    const keywordsMatch = text.match(keywordsPattern);
    if (keywordsMatch) {
      metadata.keywords = keywordsMatch[1]
        .split(/[,;]/)
        .map(k => k.trim())
        .filter(k => k.length > 0);
      console.log('Keywords:', metadata.keywords);
    }

    // Extract main sections
    const sections: { title: string; content: string; }[] = [];
    const sectionPattern = /\n(?:(?:\d+\.|[A-Z][a-z]+)\s+)([A-Z][^]*?)(?=\n(?:\d+\.|[A-Z][a-z]+)\s+|$)/g;
    let match;
    while ((match = sectionPattern.exec(text)) !== null) {
      const [fullMatch, content] = match;
      const titleMatch = content.match(/^([^\n]+)/);
      if (titleMatch) {
        sections.push({
          title: titleMatch[1].trim(),
          content: content.substring(titleMatch[1].length).trim()
        });
      }
    }
    metadata.sections = sections;
    console.log('Extracted sections:', sections.map(s => s.title));

    // Generate paper summary
    try {
      metadata.summary = await this.generatePaperSummary(text);
    } catch (error) {
      console.error('Error generating summary:', error);
    }

    return metadata;
  }

  private generateInitialTopics(metadata: PaperMetadata): TopicAnalysis {
    console.log('\n=== Generating Initial Topics ===');
    const topics: Array<{id: string; title: string; description: string; selected: boolean}> = [];
    
    // Use keywords if available
    if (metadata.keywords && metadata.keywords.length > 0) {
      topics.push(...metadata.keywords.map(keyword => ({
        id: `topic_${Math.random().toString(36).substr(2, 9)}`,
        title: keyword,
        description: `Analysis of aspects related to ${keyword} in the context of dental research.`,
        selected: false
      })));
    }

    // Extract potential topics from abstract using key phrases
    if (metadata.abstract) {
      const keyPhrases = [
        'investigate[ds]?',
        'examine[ds]?',
        'evaluate[ds]?',
        'analyze[ds]?',
        'compare[ds]?',
        'assess(?:ed|es)?',
        'determine[ds]?',
        'measure[ds]?'
      ];
      const topicPattern = new RegExp(`(?:${keyPhrases.join('|')})\\s+([^.]+)`, 'gi');
      let match;
      while ((match = topicPattern.exec(metadata.abstract)) !== null) {
        const topic = match[1].trim();
        if (topic.length > 10 && topic.length < 100) { // Reasonable length for a topic
          topics.push({
            id: `topic_${Math.random().toString(36).substr(2, 9)}`,
            title: topic,
            description: `Investigation of ${topic.toLowerCase()} as described in the paper.`,
            selected: false
          });
        }
      }
    }

    // Deduplicate topics
    const uniqueTopics = this.deduplicateTopics(topics);
    
    // Limit to 8 topics maximum
    const finalTopics = uniqueTopics.slice(0, 8);
    
    // Generate summary from metadata
    const summary = metadata.abstract 
      ? metadata.abstract.split('.').slice(0, 2).join('.') + '.'  // First two sentences of abstract
      : 'Paper analysis pending. Please select topics of interest.';

    console.log('Generated topics:', finalTopics.length);
    return { topics: finalTopics, summary };
  }

  private deduplicateTopics(topics: Array<{ id: string; title: string; description: string; selected: boolean }>): Array<{ id: string; title: string; description: string; selected: boolean }> {
    const uniqueTopics: Array<{ id: string; title: string; description: string; selected: boolean }> = [];
    const seenTitles = new Set<string>();
    
    for (const topic of topics) {
      const normalizedTitle = topic.title.toLowerCase().trim();
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueTopics.push(topic);
      }
    }
    
    return uniqueTopics;
  }

  async analyzeContent(text: string, options: ContentAnalysisOptions & { selectedTopics?: string[] }): Promise<ContentAnalysisResult> {
    console.log('\n=== Starting Content Analysis ===');
    console.log('Input text length:', text.length, 'characters');
    console.log('Analysis options:', JSON.stringify(options, null, 2));

    try {
      // Extract metadata first
      const metadata = await this.extractMetadata(text);
      
      // If no selected topics provided, return initial topic analysis without using GPT
      if (!options.selectedTopics || options.selectedTopics.length === 0) {
        console.log('\n=== Generating Initial Topics Without GPT ===');
        const topicAnalysis = this.generateInitialTopics(metadata);
        
        return {
          topicAnalysis,
          analysisComplete: false
        };
      }

      // Split text into manageable chunks for basic analysis
      console.log('\n=== Chunking Text for Analysis ===');
      const CHUNK_SIZE = 100000;
      const chunks = [];
      for (let i = 0; i < text.length; i += CHUNK_SIZE) {
        chunks.push(text.slice(i, i + CHUNK_SIZE));
      }
      
      console.log(`Created ${chunks.length} chunks for analysis`);
      chunks.forEach((chunk, i) => {
        console.log(`Chunk ${i + 1} length: ${chunk.length} characters`);
        console.log(`Chunk ${i + 1} preview: ${chunk.substring(0, 100)}...`);
      });

      // Process each chunk for basic analysis
      console.log('\n=== Starting Basic Analysis ===');
      const basicAnalysisResults = await Promise.all(
        chunks.map(async (chunk, index) => {
          console.log(`Processing chunk ${index + 1}/${chunks.length}...`);
          try {
            const result = await this.performBasicAnalysis(chunk);
            console.log(`Successfully analyzed chunk ${index + 1}`);
            return result;
          } catch (error) {
            console.error(`Error analyzing chunk ${index + 1}:`, error);
            return null;
          }
        })
      );

      console.log('\n=== Merging Analysis Results ===');
      const validResults = basicAnalysisResults.filter(result => result !== null);
      console.log(`Found ${validResults.length} valid results out of ${chunks.length} chunks`);
      
      const basicAnalysis = this.mergeBasicAnalysisResults(validResults);
      console.log('Successfully merged basic analysis results');
      
      // If deep analysis is requested, enhance with deep research
      if (options.deepAnalysis) {
        console.log('\n=== Starting Deep Analysis ===');
        console.log('Selected topics:', options.selectedTopics);
        console.log('Depth:', options.depth || 2);
        console.log('Breadth:', options.breadth || 3);
        
        const deepAnalysisResult = await this.deepResearch.analyzeWithDeepResearch(text, {
          depth: options.depth || 2,
          breadth: options.breadth || 3,
          selectedTopics: options.selectedTopics,
          onProgress: (progress) => {
            console.log('\n=== Deep Analysis Progress ===');
            console.log(JSON.stringify(progress, null, 2));
          }
        });

        console.log('\n=== Deep Analysis Complete ===');
        console.log('Merging with basic analysis results...');

        return {
          ...basicAnalysis,
          deepAnalysis: deepAnalysisResult,
          analysisComplete: true,
          selectedTopics: options.selectedTopics
        };
      }

      console.log('\n=== Analysis Complete ===');
      return {
        ...basicAnalysis,
        analysisComplete: true,
        selectedTopics: options.selectedTopics
      };
    } catch (error: Error | unknown) {
      console.error('\n=== Analysis Error ===');
      console.error('Error details:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
      throw new Error(`Content analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async performBasicAnalysis(text: string): Promise<ContentAnalysisResult> {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert dental researcher analyzing scientific papers. Analyze the provided dental research paper and return a JSON object with detailed analysis. Focus on:
          1. Study design and methodology
          2. Statistical methods and validity
          3. Clinical relevance to periodontics
          4. Quality assessment
          
          Return ONLY a valid JSON object with this exact structure:
          {
            "analysis": {
              "studyType": string (e.g., "Randomized Clinical Trial", "Systematic Review", etc.),
              "methodology": {
                "type": string,
                "description": string,
                "concerns": string[]
              },
              "statistics": {
                "methods": string[],
                "appropriateness": boolean,
                "concerns": string[]
              },
              "clinicalRelevance": {
                "score": number (0-100),
                "explanation": string,
                "implications": string[]
              },
              "evidenceLevel": {
                "level": string,
                "description": string
              },
              "perio": {
                "relevantConditions": string[],
                "treatments": string[],
                "outcomes": string[]
              }
            },
            "statisticalValidation": {
              "isValid": boolean,
              "concerns": string[],
              "suggestions": string[]
            },
            "perioRelevance": {
              "relevanceScore": number (0-100),
              "conditions": string[],
              "clinicalImplications": string[],
              "researchGaps": string[]
            },
            "methodologyQuality": {
              "score": number (0-100),
              "strengths": string[],
              "weaknesses": string[],
              "recommendations": string[]
            }
          }`
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    try {
      const responseText = completion.choices[0]?.message?.content || '';
      console.log('DEBUG: Raw OpenAI response:', responseText);
      
      const jsonStr = responseText.trim();
      console.log('DEBUG: Cleaned JSON string:', jsonStr);
      
      const analysisResult = JSON.parse(jsonStr);
      
      // Validate the structure
      if (!analysisResult.analysis || !analysisResult.statisticalValidation || 
          !analysisResult.perioRelevance || !analysisResult.methodologyQuality) {
        throw new Error('Invalid analysis result structure');
      }
      
      return analysisResult;
    } catch (error) {
      console.error('ERROR parsing analysis result:', error);
      console.error('Response content:', completion.choices[0]?.message?.content);
      throw new Error('Failed to parse analysis result');
    }
  }

  private mergeBasicAnalysisResults(results: ContentAnalysisResult[]): ContentAnalysisResult {
    if (!results || results.length === 0) {
      throw new Error('No valid analysis results to merge');
    }

    // Ensure first result has required properties
    const firstResult = results[0];
    if (!firstResult.analysis) {
      throw new Error('First result missing analysis data');
    }

    // Combine all unique conditions, treatments, and outcomes
    const perio = {
      relevantConditions: Array.from(new Set(results.flatMap(r => r.analysis?.perio?.relevantConditions || []))),
      treatments: Array.from(new Set(results.flatMap(r => r.analysis?.perio?.treatments || []))),
      outcomes: Array.from(new Set(results.flatMap(r => r.analysis?.perio?.outcomes || [])))
    };

    // Average the scores
    const averageScore = (scores: number[]) => 
      Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    return {
      analysis: {
        studyType: firstResult.analysis.studyType,
        methodology: {
          type: firstResult.analysis.methodology.type,
          description: firstResult.analysis.methodology.description,
          concerns: Array.from(new Set(results.flatMap(r => r.analysis?.methodology?.concerns || [])))
        },
        statistics: {
          methods: Array.from(new Set(results.flatMap(r => r.analysis?.statistics?.methods || []))),
          appropriateness: results.every(r => r.analysis?.statistics?.appropriateness || false),
          concerns: Array.from(new Set(results.flatMap(r => r.analysis?.statistics?.concerns || [])))
        },
        clinicalRelevance: {
          score: averageScore(results.map(r => r.analysis?.clinicalRelevance?.score || 0)),
          explanation: firstResult.analysis.clinicalRelevance.explanation,
          implications: Array.from(new Set(results.flatMap(r => r.analysis?.clinicalRelevance?.implications || [])))
        },
        evidenceLevel: firstResult.analysis.evidenceLevel,
        perio
      },
      statisticalValidation: {
        isValid: results.every(r => r.statisticalValidation?.isValid || false),
        concerns: Array.from(new Set(results.flatMap(r => r.statisticalValidation?.concerns || []))),
        suggestions: Array.from(new Set(results.flatMap(r => r.statisticalValidation?.suggestions || [])))
      },
      perioRelevance: {
        relevanceScore: averageScore(results.map(r => r.perioRelevance?.relevanceScore || 0)),
        conditions: Array.from(new Set(results.flatMap(r => r.perioRelevance?.conditions || []))),
        clinicalImplications: Array.from(new Set(results.flatMap(r => r.perioRelevance?.clinicalImplications || []))),
        researchGaps: Array.from(new Set(results.flatMap(r => r.perioRelevance?.researchGaps || [])))
      },
      methodologyQuality: {
        score: averageScore(results.map(r => r.methodologyQuality?.score || 0)),
        strengths: Array.from(new Set(results.flatMap(r => r.methodologyQuality?.strengths || []))),
        weaknesses: Array.from(new Set(results.flatMap(r => r.methodologyQuality?.weaknesses || []))),
        recommendations: Array.from(new Set(results.flatMap(r => r.methodologyQuality?.recommendations || [])))
      },
      analysisComplete: true
    };
  }

  private async analyzeChunks(chunks: string[], analysisType: string): Promise<any> {
    console.log(`\n=== Starting ${analysisType} Analysis ===`);
    console.log(`Processing ${chunks.length} chunks`);
    const results = [];

    try {
      for (let index = 0; index < chunks.length; index++) {
        let chunkContent = chunks[index];
        console.log(`\n=== Processing ${analysisType} Chunk ${index + 1}/${chunks.length} ===`);
        console.log('Chunk preview:', chunkContent.substring(0, 100) + '...');

        try {
          if (chunkContent.length > AnalyzerService.CHUNK_SIZE) {
            console.warn(`Chunk ${index + 1} exceeds maximum size, truncating to ${AnalyzerService.CHUNK_SIZE} characters`);
            chunkContent = chunkContent.substring(0, AnalyzerService.CHUNK_SIZE);
          }

          console.log('Sending chunk to OpenAI for analysis...');
          const response = await this.openai.chat.completions.create({
            model: AnalyzerService.MODEL,
            messages: [
              { 
                role: 'user', 
                content: `${analysisType === 'deep' ? 
                  AnalyzerService.DEEP_ANALYSIS_PROMPT : 
                  AnalyzerService.ANALYSIS_PROMPT}\n\n${chunkContent}`
              }
            ]
          });

          if (!response.choices?.[0]?.message?.content) {
            throw new Error('Empty response from OpenAI API');
          }

          const content = response.choices[0].message.content;
          console.log('Received response from OpenAI');
          
          try {
            console.log('Parsing response as JSON...');
            const parsedContent = JSON.parse(content);
            results.push(parsedContent);
            console.log('Successfully parsed and stored result');
          } catch (parseError) {
            console.error('Error parsing JSON response:', content);
            throw new Error(`Failed to parse API response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
          }
        } catch (error: Error | unknown) {
          console.error(`Error analyzing chunk ${index + 1}:`, error);
          console.error('Failed chunk preview:', chunkContent.substring(0, 100) + '...');
          throw error;
        }
      }

      console.log('\n=== Analysis Complete ===');
      console.log(`Successfully analyzed all ${chunks.length} chunks`);
      return this.mergeResults(results, analysisType);
    } catch (error: Error | unknown) {
      console.error('\n=== Analysis Error ===');
      console.error('Error details:', error);
      throw new Error(`Failed to analyze ${analysisType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mergeResults(results: any[], analysisType: string): ContentAnalysisResult {
    console.log('\n=== Merging Results ===');
    if (!results || results.length === 0) {
      throw new Error(`No results to merge for ${analysisType}`);
    }

    console.log(`Merging ${results.length} results`);
    const merged = {
      analysisComplete: true,
      analysis: results[0].analysis || {},
      statisticalValidation: results[0].statisticalValidation || {},
      perioRelevance: results[0].perioRelevance || {},
      methodologyQuality: results[0].methodologyQuality || {}
    };
    console.log('Successfully merged results');

    return merged;
  }

  private async generatePaperSummary(text: string): Promise<string> {
    console.log('\n=== Generating Paper Summary ===');
    try {
      // Split text into chunks if it's too long
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += AnalyzerService.CHUNK_SIZE) {
        chunks.push(text.slice(i, i + AnalyzerService.CHUNK_SIZE));
      }
      console.log(`Split text into ${chunks.length} chunks for summary generation`);

      // If multiple chunks, process each chunk and combine
      if (chunks.length > 1) {
        const chunkSummaries = await Promise.all(
          chunks.map(async (chunk, index) => {
            console.log(`Processing chunk ${index + 1}/${chunks.length} for summary`);
            const completion = await this.openai.chat.completions.create({
              model: AnalyzerService.MODEL,
              messages: [
                {
                  role: "system",
                  content: `${AnalyzerService.SUMMARY_PROMPT}\nThis is part ${index + 1} of ${chunks.length} of the paper.`
                },
                {
                  role: "user",
                  content: chunk
                }
              ],
              temperature: 0.2,
              max_tokens: 1000
            });
            return completion.choices[0]?.message?.content || '';
          })
        );

        // Combine chunk summaries
        const combinedSummary = await this.openai.chat.completions.create({
          model: AnalyzerService.MODEL,
          messages: [
            {
              role: "system",
              content: "Combine these paper summary chunks into a coherent 500-1000 word summary. Maintain focus on the key points and ensure smooth transitions."
            },
            {
              role: "user",
              content: chunkSummaries.join("\n\n")
            }
          ],
          temperature: 0.2,
          max_tokens: 2000
        });

        return combinedSummary.choices[0]?.message?.content || '';
      }

      // For single chunk, process directly
      const completion = await this.openai.chat.completions.create({
        model: AnalyzerService.MODEL,
        messages: [
          {
            role: "system",
            content: AnalyzerService.SUMMARY_PROMPT
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });

      const summary = completion.choices[0]?.message?.content || '';
      console.log('Summary generated successfully');
      return summary;
    } catch (error) {
      console.error('Error generating paper summary:', error);
      throw new Error('Failed to generate paper summary');
    }
  }
}
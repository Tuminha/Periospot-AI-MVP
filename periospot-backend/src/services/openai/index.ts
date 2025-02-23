import OpenAI from 'openai';
import { config } from '../../config';
import { AppError } from '../../api/middleware/errorHandler';

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

export class OpenAIService {
  static async analyzeArticle(text: string) {
    try {
      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert dental research analyst. Analyze the provided scientific article for:
              1. Inconsistencies between results and conclusions
              2. Statistical flaws (unusual standard deviations, suspicious p-values, inappropriate tests)
              3. Reference misinterpretations
              Provide a structured analysis with specific examples and explanations.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new AppError(500, 'Error analyzing article. Please try again.');
    }
  }

  static async validateStatistics(text: string) {
    try {
      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert statistician. Analyze the statistical methods and results in this dental research article. Focus on:
              1. Appropriateness of statistical tests
              2. Validity of p-values
              3. Standard deviation anomalies
              4. Sample size adequacy
              Provide detailed explanations for any issues found.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new AppError(500, 'Error validating statistics. Please try again.');
    }
  }

  static async checkReferences(text: string, references: string[]) {
    try {
      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert in scientific literature review. Compare how the article cites and interprets its references with the actual content of those references. Identify any:
              1. Misquotations
              2. Overstatements
              3. Context misrepresentations
              4. Selective citation bias
              Provide specific examples and explanations.`
          },
          {
            role: 'user',
            content: `Article Text: ${text}\n\nReference Content: ${references.join('\n\n')}`
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new AppError(500, 'Error checking references. Please try again.');
    }
  }
} 
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../../config");
const errorHandler_1 = require("../../api/middleware/errorHandler");
const openai = new openai_1.default({
    apiKey: config_1.config.openai.apiKey
});
class OpenAIService {
    static async analyzeArticle(text) {
        try {
            const response = await openai.chat.completions.create({
                model: config_1.config.openai.model,
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
        }
        catch (error) {
            console.error('OpenAI API Error:', error);
            throw new errorHandler_1.AppError(500, 'Error analyzing article. Please try again.');
        }
    }
    static async validateStatistics(text) {
        try {
            const response = await openai.chat.completions.create({
                model: config_1.config.openai.model,
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
        }
        catch (error) {
            console.error('OpenAI API Error:', error);
            throw new errorHandler_1.AppError(500, 'Error validating statistics. Please try again.');
        }
    }
    static async checkReferences(text, references) {
        try {
            const response = await openai.chat.completions.create({
                model: config_1.config.openai.model,
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
        }
        catch (error) {
            console.error('OpenAI API Error:', error);
            throw new errorHandler_1.AppError(500, 'Error checking references. Please try again.');
        }
    }
}
exports.OpenAIService = OpenAIService;

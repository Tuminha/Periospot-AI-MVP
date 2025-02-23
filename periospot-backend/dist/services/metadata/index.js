"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataService = void 0;
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("../../api/middleware/errorHandler");
class MetadataService {
    static async extractIdentifiers(text) {
        // DOI regex pattern
        const doiPattern = /\b(10\.\d{4,}(?:\.\d+)*\/\S+(?:(?!["&'<>])\S)*)\b/i;
        const doiMatch = text.match(doiPattern);
        // PMID regex pattern
        const pmidPattern = /PMID:\s*(\d+)/i;
        const pmidMatch = text.match(pmidPattern);
        return {
            doi: doiMatch ? doiMatch[1] : undefined,
            pmid: pmidMatch ? pmidMatch[1] : undefined
        };
    }
    static async getMetadataFromPubMed(pmid) {
        try {
            const url = `${this.PUBMED_BASE_URL}/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json&api_key=${this.PUBMED_API_KEY}`;
            const response = await axios_1.default.get(url);
            const data = response.data.result[pmid];
            if (!data) {
                throw new Error('No data found in PubMed response');
            }
            return {
                pmid,
                title: data.title,
                authors: data.authors?.map((author) => ({
                    lastName: author.name,
                    firstName: author.fore || '',
                    affiliation: author.affiliation || ''
                })),
                journal: data.fulljournalname,
                publicationYear: parseInt(data.pubdate),
                abstract: data.abstract,
                keywords: data.keywords || []
            };
        }
        catch (error) {
            console.error('PubMed API error:', error);
            throw new errorHandler_1.AppError(500, 'Failed to fetch metadata from PubMed');
        }
    }
    static async getMetadataFromCrossref(doi) {
        try {
            const url = `${this.CROSSREF_BASE_URL}/${doi}`;
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': `Periospot/1.0 (${this.EMAIL})`
                }
            });
            const work = response.data.message;
            return {
                doi,
                title: work.title?.[0],
                authors: work.author?.map((author) => ({
                    firstName: author.given,
                    lastName: author.family,
                    affiliation: author.affiliation?.[0]?.name
                })),
                journal: work['container-title']?.[0],
                publicationYear: work.published?.['date-parts']?.[0]?.[0],
                abstract: work.abstract,
                citations: work['is-referenced-by-count'],
                keywords: work.subject
            };
        }
        catch (error) {
            console.error('Crossref API error:', error);
            throw new errorHandler_1.AppError(500, 'Failed to fetch metadata from Crossref');
        }
    }
    static async getMetadataFromSemanticScholar(doi) {
        try {
            const url = `https://api.semanticscholar.org/v1/paper/${doi}`;
            const response = await axios_1.default.get(url);
            const data = response.data;
            return {
                doi,
                title: data.title,
                authors: data.authors?.map((author) => ({
                    firstName: author.name.split(' ').slice(0, -1).join(' '),
                    lastName: author.name.split(' ').slice(-1)[0]
                })),
                journal: data.venue,
                publicationYear: data.year,
                abstract: data.abstract,
                citations: data.citationCount,
                impactFactor: data.influentialCitationCount
            };
        }
        catch (error) {
            console.error('Semantic Scholar API error:', error);
            throw new errorHandler_1.AppError(500, 'Failed to fetch metadata from Semantic Scholar');
        }
    }
    static async getMetadata(text) {
        const identifiers = await this.extractIdentifiers(text);
        let metadata = null;
        let errors = [];
        // Try PubMed first if PMID is available
        if (identifiers.pmid) {
            try {
                metadata = await this.getMetadataFromPubMed(identifiers.pmid);
                return metadata;
            }
            catch (error) {
                errors.push(error);
            }
        }
        // Try Crossref if DOI is available
        if (identifiers.doi) {
            try {
                metadata = await this.getMetadataFromCrossref(identifiers.doi);
                return metadata;
            }
            catch (error) {
                errors.push(error);
            }
            // Try Semantic Scholar as a final fallback
            try {
                metadata = await this.getMetadataFromSemanticScholar(identifiers.doi);
                return metadata;
            }
            catch (error) {
                errors.push(error);
            }
        }
        // If all attempts fail, throw an error with details
        if (!metadata) {
            console.error('All metadata retrieval attempts failed:', errors);
            throw new errorHandler_1.AppError(500, 'Failed to retrieve article metadata from all available sources');
        }
        return metadata;
    }
}
exports.MetadataService = MetadataService;
MetadataService.PUBMED_API_KEY = process.env.PUBMED_API_KEY;
MetadataService.PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
MetadataService.CROSSREF_BASE_URL = 'https://api.crossref.org/works';
MetadataService.EMAIL = 'your-email@periospot.com'; // Add this to your .env

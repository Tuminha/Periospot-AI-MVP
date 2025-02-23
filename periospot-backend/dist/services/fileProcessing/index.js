"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileProcessor = void 0;
const pdfParse = __importStar(require("pdf-parse"));
const mammoth = __importStar(require("mammoth"));
const errorHandler_1 = require("../../api/middleware/errorHandler");
const metadata_1 = require("../metadata");
class FileProcessor {
    static async extractText(file) {
        const fileType = file.mimetype;
        console.log('🔍 Starting file processing:', {
            mimetype: fileType,
            originalname: file.originalname,
            size: file.size,
            buffer: file.buffer ? `Buffer size: ${file.buffer.length}` : 'No buffer'
        });
        try {
            let extractedText = '';
            switch (fileType) {
                case 'application/pdf':
                    console.log('📄 Processing PDF file');
                    if (!file.buffer) {
                        throw new errorHandler_1.AppError(400, 'Invalid PDF file: No buffer present');
                    }
                    try {
                        console.log('⚙️ Attempting to parse PDF with buffer size:', file.buffer.length);
                        const pdfData = await pdfParse.default(file.buffer);
                        console.log('✅ PDF parsing successful');
                        if (!pdfData || !pdfData.text) {
                            console.error('❌ PDF parsing failed: No text extracted');
                            throw new errorHandler_1.AppError(400, 'Could not extract text from PDF file');
                        }
                        console.log('📝 PDF processing successful, extracted text length:', pdfData.text.length);
                        extractedText = pdfData.text;
                    }
                    catch (pdfError) {
                        console.error('❌ PDF processing error:', pdfError);
                        throw new errorHandler_1.AppError(400, 'Failed to process PDF file. Please ensure it is not corrupted.');
                    }
                    break;
                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    console.log('Processing DOCX file');
                    if (!file.buffer) {
                        throw new errorHandler_1.AppError(400, 'Invalid DOCX file: No buffer present');
                    }
                    try {
                        const { value: docxText } = await mammoth.extractRawText({ buffer: file.buffer });
                        if (!docxText) {
                            throw new errorHandler_1.AppError(400, 'Could not extract text from DOCX file');
                        }
                        console.log('DOCX processing successful, extracted text length:', docxText.length);
                        extractedText = docxText;
                    }
                    catch (docxError) {
                        console.error('DOCX processing error:', docxError);
                        throw new errorHandler_1.AppError(400, 'Failed to process DOCX file. Please ensure it is not corrupted.');
                    }
                    break;
                default:
                    console.log('❌ Unsupported file type:', fileType);
                    throw new errorHandler_1.AppError(400, 'Unsupported file type. Please upload a PDF or DOCX file.');
            }
            // Extract metadata from the text
            console.log('🔍 Attempting to extract metadata from text');
            try {
                const metadata = await metadata_1.MetadataService.getMetadata(extractedText);
                console.log('✅ Successfully extracted metadata:', metadata);
                return { text: extractedText, metadata };
            }
            catch (metadataError) {
                console.error('⚠️ Failed to extract metadata:', metadataError);
                // Return the text even if metadata extraction fails
                return { text: extractedText };
            }
        }
        catch (error) {
            console.error('❌ File processing error:', error);
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(500, 'Error processing file. Please try again.');
        }
    }
    static validateFileType(mimetype) {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        const isValid = allowedTypes.includes(mimetype);
        console.log('File type validation:', { mimetype, isValid });
        return isValid;
    }
}
exports.FileProcessor = FileProcessor;

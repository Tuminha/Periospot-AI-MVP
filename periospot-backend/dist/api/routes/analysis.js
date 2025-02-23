"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fileProcessing_1 = require("../../services/fileProcessing");
const openai_1 = require("../../services/openai");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
// Configure multer for file upload
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post('/upload', upload.single('file'), async (req, res, next) => {
    console.log('📥 Received upload request');
    try {
        if (!req.file) {
            console.log('❌ No file received in request');
            throw new errorHandler_1.AppError(400, 'No file uploaded');
        }
        console.log('📄 File details:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
        // Validate file type
        if (!fileProcessing_1.FileProcessor.validateFileType(req.file.mimetype)) {
            console.log('❌ Invalid file type:', req.file.mimetype);
            throw new errorHandler_1.AppError(400, 'Invalid file type. Please upload a PDF or DOCX file.');
        }
        console.log('✅ File type validation passed');
        // Process file and extract text and metadata
        const { text, metadata } = await fileProcessing_1.FileProcessor.extractText(req.file);
        console.log('✅ File processed successfully');
        res.json({
            message: 'File processed successfully',
            metadata
        });
    }
    catch (error) {
        console.error('❌ Error processing upload:', error);
        next(error);
    }
});
router.post('/validate-statistics', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new errorHandler_1.AppError(400, 'No file uploaded');
        }
        if (!fileProcessing_1.FileProcessor.validateFileType(req.file.mimetype)) {
            throw new errorHandler_1.AppError(400, 'Invalid file type. Please upload a PDF or DOCX file.');
        }
        const { text } = await fileProcessing_1.FileProcessor.extractText(req.file);
        const validation = await openai_1.OpenAIService.validateStatistics(text);
        res.json({
            status: 'success',
            data: {
                validation
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/check-references', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new errorHandler_1.AppError(400, 'No file uploaded');
        }
        if (!req.body.references) {
            throw new errorHandler_1.AppError(400, 'No references provided');
        }
        if (!fileProcessing_1.FileProcessor.validateFileType(req.file.mimetype)) {
            throw new errorHandler_1.AppError(400, 'Invalid file type. Please upload a PDF or DOCX file.');
        }
        const { text } = await fileProcessing_1.FileProcessor.extractText(req.file);
        const references = JSON.parse(req.body.references);
        const analysis = await openai_1.OpenAIService.checkReferences(text, references);
        res.json({
            status: 'success',
            data: {
                analysis
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;

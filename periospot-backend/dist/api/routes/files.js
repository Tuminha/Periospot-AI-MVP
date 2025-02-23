"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const config_1 = require("../../config");
const fileProcessing_1 = require("../../services/fileProcessing");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    limits: {
        fileSize: config_1.config.storage.maxFileSize
    }
});
router.post('/extract-text', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new errorHandler_1.AppError(400, 'No file uploaded');
        }
        if (!fileProcessing_1.FileProcessor.validateFileType(req.file.mimetype)) {
            throw new errorHandler_1.AppError(400, 'Invalid file type. Please upload a PDF or DOCX file.');
        }
        const text = await fileProcessing_1.FileProcessor.extractText(req.file);
        res.json({
            status: 'success',
            data: {
                text
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/validate', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new errorHandler_1.AppError(400, 'No file uploaded');
        }
        const isValid = fileProcessing_1.FileProcessor.validateFileType(req.file.mimetype);
        res.json({
            status: 'success',
            data: {
                isValid,
                message: isValid ? 'File type is valid' : 'Invalid file type. Please upload a PDF or DOCX file.'
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;

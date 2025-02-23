import express from 'express';
import multer from 'multer';
import { config } from '../../config';
import { FileProcessor } from '../../services/fileProcessing';
import { OpenAIService } from '../../services/openai';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// Configure multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res, next) => {
  console.log('📥 Received upload request');
  try {
    if (!req.file) {
      console.log('❌ No file received in request');
      throw new AppError(400, 'No file uploaded');
    }

    console.log('📄 File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Validate file type
    if (!FileProcessor.validateFileType(req.file.mimetype)) {
      console.log('❌ Invalid file type:', req.file.mimetype);
      throw new AppError(400, 'Invalid file type. Please upload a PDF or DOCX file.');
    }

    console.log('✅ File type validation passed');

    // Process file and extract text and metadata
    const { text, metadata } = await FileProcessor.extractText(req.file);
    console.log('✅ File processed successfully');

    res.json({
      message: 'File processed successfully',
      metadata
    });
  } catch (error) {
    console.error('❌ Error processing upload:', error);
    next(error);
  }
});

router.post('/validate-statistics', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    if (!FileProcessor.validateFileType(req.file.mimetype)) {
      throw new AppError(400, 'Invalid file type. Please upload a PDF or DOCX file.');
    }

    const { text } = await FileProcessor.extractText(req.file);
    const validation = await OpenAIService.validateStatistics(text);

    res.json({
      status: 'success',
      data: {
        validation
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/check-references', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    if (!req.body.references) {
      throw new AppError(400, 'No references provided');
    }

    if (!FileProcessor.validateFileType(req.file.mimetype)) {
      throw new AppError(400, 'Invalid file type. Please upload a PDF or DOCX file.');
    }

    const { text } = await FileProcessor.extractText(req.file);
    const references = JSON.parse(req.body.references);
    const analysis = await OpenAIService.checkReferences(text, references);

    res.json({
      status: 'success',
      data: {
        analysis
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 
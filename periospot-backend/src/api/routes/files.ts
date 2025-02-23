import { Router } from 'express';
import multer from 'multer';
import { config } from '../../config';
import { FileProcessor } from '../../services/fileProcessing';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const upload = multer({
  limits: {
    fileSize: config.storage.maxFileSize
  }
});

router.post('/extract-text', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    if (!FileProcessor.validateFileType(req.file.mimetype)) {
      throw new AppError(400, 'Invalid file type. Please upload a PDF or DOCX file.');
    }

    const text = await FileProcessor.extractText(req.file);

    res.json({
      status: 'success',
      data: {
        text
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/validate', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    const isValid = FileProcessor.validateFileType(req.file.mimetype);

    res.json({
      status: 'success',
      data: {
        isValid,
        message: isValid ? 'File type is valid' : 'Invalid file type. Please upload a PDF or DOCX file.'
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { AppError } from '../../api/middleware/errorHandler';
import { MetadataService } from '../metadata';

export interface ProcessedFile {
  text: string;
  metadata?: any;
}

export class FileProcessor {
  static async extractText(file: Express.Multer.File): Promise<ProcessedFile> {
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
            throw new AppError(400, 'Invalid PDF file: No buffer present');
          }
          try {
            console.log('⚙️ Attempting to parse PDF with buffer size:', file.buffer.length);
            const pdfData = await pdfParse.default(file.buffer);
            console.log('✅ PDF parsing successful');
            
            if (!pdfData || !pdfData.text) {
              console.error('❌ PDF parsing failed: No text extracted');
              throw new AppError(400, 'Could not extract text from PDF file');
            }
            console.log('📝 PDF processing successful, extracted text length:', pdfData.text.length);
            extractedText = pdfData.text;
          } catch (pdfError) {
            console.error('❌ PDF processing error:', pdfError);
            throw new AppError(400, 'Failed to process PDF file. Please ensure it is not corrupted.');
          }
          break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          console.log('Processing DOCX file');
          if (!file.buffer) {
            throw new AppError(400, 'Invalid DOCX file: No buffer present');
          }
          try {
            const { value: docxText } = await mammoth.extractRawText({ buffer: file.buffer });
            if (!docxText) {
              throw new AppError(400, 'Could not extract text from DOCX file');
            }
            console.log('DOCX processing successful, extracted text length:', docxText.length);
            extractedText = docxText;
          } catch (docxError) {
            console.error('DOCX processing error:', docxError);
            throw new AppError(400, 'Failed to process DOCX file. Please ensure it is not corrupted.');
          }
          break;

        default:
          console.log('❌ Unsupported file type:', fileType);
          throw new AppError(400, 'Unsupported file type. Please upload a PDF or DOCX file.');
      }

      // Extract metadata from the text
      console.log('🔍 Attempting to extract metadata from text');
      try {
        const metadata = await MetadataService.getMetadata(extractedText);
        console.log('✅ Successfully extracted metadata:', metadata);
        return { text: extractedText, metadata };
      } catch (metadataError) {
        console.error('⚠️ Failed to extract metadata:', metadataError);
        // Return the text even if metadata extraction fails
        return { text: extractedText };
      }

    } catch (error) {
      console.error('❌ File processing error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error processing file. Please try again.');
    }
  }

  static validateFileType(mimetype: string): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const isValid = allowedTypes.includes(mimetype);
    console.log('File type validation:', { mimetype, isValid });
    return isValid;
  }
} 
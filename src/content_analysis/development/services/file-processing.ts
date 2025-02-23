import { PDFDocument } from 'pdf-lib';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import { FileType } from '../types/file';

export class FileProcessor {
  private static readonly CHUNK_SIZE = 100000;

  private static cleanPDFText(text: string): string {
    console.log(`Original text length: ${text.length}`);
    
    // Remove non-printable characters except newlines and tabs
    let cleaned = text.replace(/[^\x20-\x7E\n\t]/g, '');
    
    // Normalize line endings
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Remove excessive newlines (more than 2 in a row)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Split into lines, filter out lines that are just whitespace
    cleaned = cleaned.split('\n')
      .filter(line => line.trim().length > 0)
      .join('\n');
    
    // Trim excessive whitespace
    cleaned = cleaned.replace(/[ \t]+/g, ' ').trim();
    
    console.log(`Cleaned text length: ${cleaned.length}`);
    return cleaned;
  }

  public static async extractText(file: ArrayBuffer, fileType: FileType): Promise<string> {
    let extractedText = '';

    try {
      if (fileType === FileType.PDF) {
        const pdfData = await pdf(file);
        extractedText = this.cleanPDFText(pdfData.text);
        console.log(`PDF text extracted successfully. Length: ${extractedText.length}`);
      } else if (fileType === FileType.DOCX) {
        const docxText = await mammoth.extractRawText({ arrayBuffer: file });
        extractedText = this.cleanPDFText(docxText.value);
        console.log(`DOCX text extracted successfully. Length: ${extractedText.length}`);
      }

      return extractedText;
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error(`Failed to extract text from ${fileType} file: ${error.message}`);
    }
  }
} 
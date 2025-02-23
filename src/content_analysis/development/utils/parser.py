"""
PDF Parser utility for extracting text from research papers.
"""
import PyPDF2
from typing import Optional

class PDFParser:
    def __init__(self):
        pass

    def extract_text_from_pdf(self, pdf_path: str) -> Optional[str]:
        """
        Extract text content from a PDF file.
        
        Args:
            pdf_path (str): Path to the PDF file
            
        Returns:
            str: Extracted text content
            None: If extraction fails
        """
        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
                return text
        except Exception as e:
            print(f"Error extracting text from PDF: {str(e)}")
            return None

    def extract_text_with_metadata(self, pdf_path: str) -> dict:
        """
        Extract text content and metadata from a PDF file.
        
        Args:
            pdf_path (str): Path to the PDF file
            
        Returns:
            dict: Dictionary containing text content and metadata
        """
        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                metadata = reader.metadata
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
                
                return {
                    "text": text,
                    "metadata": metadata,
                    "num_pages": len(reader.pages)
                }
        except Exception as e:
            print(f"Error extracting text and metadata from PDF: {str(e)}")
            return {
                "text": "",
                "metadata": {},
                "num_pages": 0,
                "error": str(e)
            } 
"""
Content Analysis Service for analyzing research papers.
"""
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from transformers import pipeline
from typing import Dict, List, Optional

class ContentAnalyzer:
    def __init__(self):
        # Ensure we have the required NLTK data
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
            
        # Initialize SciBERT pipeline for scientific text analysis
        self.sci_model = pipeline(
            "text-classification",
            model="allenai/scibert_scivocab_uncased",
            return_all_scores=True
        )

    def analyze_content(self, text: str) -> Dict:
        """
        Analyze the content of a research paper.
        
        Args:
            text (str): The text content to analyze
            
        Returns:
            Dict: Analysis results including structure, clarity, and quality scores
        """
        return {
            "structure": self._analyze_structure(text),
            "clarity": self._analyze_clarity(text),
            "quality": self._analyze_quality(text)
        }

    def _analyze_structure(self, text: str) -> Dict:
        """Analyze the IMRAD structure of the paper."""
        # TODO: Implement IMRAD structure detection
        return {
            "hasIntroduction": False,
            "hasMethods": False,
            "hasResults": False,
            "hasDiscussion": False,
            "score": 0
        }

    def _analyze_clarity(self, text: str) -> Dict:
        """Analyze the clarity and readability of the text."""
        try:
            flesch_score = self._calculate_flesch_score(text)
            return {
                "readabilityScore": flesch_score,
                "technicalAccuracy": 0,  # TODO: Implement technical accuracy check
                "suggestions": []  # TODO: Add clarity improvement suggestions
            }
        except Exception as e:
            print(f"Error in clarity analysis: {str(e)}")
            return {
                "readabilityScore": 0,
                "technicalAccuracy": 0,
                "suggestions": [f"Error in analysis: {str(e)}"]
            }

    def _analyze_quality(self, text: str) -> Dict:
        """Analyze the scientific quality of the paper."""
        # TODO: Implement quality analysis using SciBERT
        return {
            "citationQuality": 0,
            "methodologyStrength": 0,
            "overallScore": 0
        }

    def _calculate_flesch_score(self, text: str) -> float:
        """Calculate the Flesch Reading Ease score."""
        sentences = sent_tokenize(text)
        words = word_tokenize(text)
        
        if not sentences or not words:
            return 0
            
        # Count syllables (simplified method)
        syllable_count = sum(self._count_syllables(word) for word in words)
        
        # Calculate Flesch Reading Ease score
        words_per_sentence = len(words) / len(sentences)
        syllables_per_word = syllable_count / len(words)
        
        return 206.835 - (1.015 * words_per_sentence) - (84.6 * syllables_per_word)

    def _count_syllables(self, word: str) -> int:
        """
        Count the number of syllables in a word (simplified method).
        This is a basic implementation and might need improvement.
        """
        word = word.lower()
        count = 0
        vowels = "aeiouy"
        prev_char_is_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_char_is_vowel:
                count += 1
            prev_char_is_vowel = is_vowel
            
        if word.endswith("e"):
            count -= 1
        if count == 0:
            count = 1
            
        return count 
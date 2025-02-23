# Content Analysis Development Plan

## Objective
Enhance the "Content Analysis" feature of the Periospot research paper analysis tool by integrating the "deep-research" repository (https://github.com/dzhng/deep-research). This integration aims to provide advanced users, such as dental researchers like Francisco T. Barbosa, with iterative research, intelligent query generation, and comprehensive Markdown reports, validating paper claims with external sources while maintaining simplicity for basic users via an optional "Deep Analysis" mode.

## Current Features
- **Structure Evaluation**: Analyzes the organization of dental research papers using the IMRAD framework (Introduction, Methods, Results, and Discussion).
- **Clarity Assessment**: Evaluates readability using metrics like the Flesch score to ensure clear communication.
- **Scientific Writing Quality**: Provides feedback on abstract quality, argument coherence, and appropriate use of technical terminology.

## Enhanced Features with Deep-Research
- **Smart PDF Processing**: Automatically extracts and cleans text from uploaded PDFs, removing binary data and formatting artifacts while preserving essential content structure.
- **Intelligent Metadata Extraction**: Extracts key metadata including title, authors, abstract, and keywords using a combination of traditional pattern matching and AI-powered analysis.
- **Dynamic Topic Selection**: Uses GPT-4o model to analyze paper content and generate 3-8 focused research topics as checkboxes, allowing users to select specific aspects for deep analysis.
- **Iterative Research**: Validates claims in dental papers (e.g., "finite element simulations predict implant stability") by iteratively searching external sources using LLMs and web scraping, refining directions based on findings.
- **Intelligent Query Generation**: Generates targeted queries (e.g., "latest studies on dental implant stability") using OpenAI LLMs, seeded by paper text, to explore broader context.
- **Comprehensive Reports**: Produces detailed Markdown reports combining internal analysis (e.g., Flesch score, IMRAD feedback) with external validation (e.g., "Source: Journal of Biomechanics, 2023"), downloadable via the UI.
- **Depth & Breadth Control**: Allows users to customize research scope through depth (iterations) and breadth (query range) parameters.
- **Concurrent Processing**: Handles multiple papers or queries efficiently using parallel processing from "deep-research."

## Tools and Tech Stack

### Python Packages
- `transformers`: For SciBERT to analyze scientific text (e.g., terminology, coherence).
- `torch`: Backend for SciBERT and NLP tasks.
- `openai`: For LLM-driven query generation and processing via OpenAI API.
- `PyPDF2`: For parsing PDF uploads of dental research papers.
- `nltk`: For readability metrics (e.g., Flesch score).
- `beautifulsoup4`: For web scraping alongside Firecrawl.
- `requests`: For API calls to Firecrawl and OpenAI.
- `markdown-it-py`: For generating Markdown reports.
- `python-dotenv`: For managing API keys in `.env.local`.

### APIs
- **OpenAI API**: Powers intelligent query generation and text processing (requires `OPENAI_KEY`).
- **Firecrawl API**: Enables web scraping and SERP queries (requires `FIRECRAWL_KEY`).

### Languages and Frameworks
- **Python 3.9+**: Core backend language for Periospot and integration logic.
- **TypeScript/Node.js**: For adapting and running "deep-research" code.
- **React/JavaScript**: For UI updates (e.g., "Deep Analysis" toggle).

### Additional Tools
- **Git**: Version control for tracking changes.
- **Cursor AI**: Development assistance and code generation.
- **pytest**: For unit and integration testing.

## Implementation Steps

### 1. Parse Uploaded Paper
- **Goal**: Extract text and metadata from uploaded PDFs for analysis.
- **Code**: In `periospot-backend/src/content-analysis/parser.py`:
  ```python
  import PyPDF2
  from typing import Dict, Optional

  class PDFParser:
      def extract_text_and_metadata(pdf_path: str) -> Dict:
          with open(pdf_path, 'rb') as file:
              reader = PyPDF2.PdfReader(file)
              text = ""
              for page in reader.pages:
                  text += page.extract_text()
              
              # Clean extracted text
              cleaned_text = self.clean_pdf_text(text)
              
              # Extract metadata
              metadata = {
                  'title': self.extract_title(cleaned_text),
                  'abstract': self.extract_abstract(cleaned_text),
                  'keywords': self.extract_keywords(cleaned_text),
                  'authors': self.extract_authors(cleaned_text),
                  'num_pages': len(reader.pages)
              }
              
              return {
                  'text': cleaned_text,
                  'metadata': metadata
              }

      def clean_pdf_text(text: str) -> str:
          # Remove binary data and formatting artifacts
          cleaned = text.replace(/[^\x20-\x7E\n\t]/g, '')
          # Normalize line endings
          cleaned = cleaned.replace(/\r\n/g, '\n')
          # Remove excessive whitespace
          cleaned = cleaned.replace(/\s+/g, ' ').trim()
          return cleaned
  ```
- **Test**: Upload a sample PDF and verify text and metadata extraction.

### 2. Generate Topic Checkboxes
- **Goal**: Use GPT-4o to analyze paper content and generate relevant research topics.
- **Code**: In `src/content_analysis/development/services/analyzer.ts`:
  ```typescript
  private async generateTopicCheckboxes(text: string): Promise<TopicAnalysis> {
      const completion = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
              {
                  role: "system",
                  content: "You are a dental research expert. Analyze the paper and generate 3-8 focused research topics that warrant deep analysis. Each topic should be specific, relevant to periodontics, and suitable for validation against external sources."
              },
              {
                  role: "user",
                  content: text
              }
          ],
          temperature: 0.2,
          response_format: { type: "json_object" }
      });

      const topics = JSON.parse(completion.choices[0].message.content);
      return {
          topics: topics.map(topic => ({
              id: uuidv4(),
              title: topic.title,
              description: topic.description,
              selected: false
          })),
          summary: topics.summary
      };
  }
  ```
- **Test**: Generate topics for a sample paper and verify checkbox functionality.

### 3. Perform Current Content Analysis
- **Goal**: Run existing analysis (structure, clarity, quality).
- **Code**: In `content_analysis.py`:
  ```python
  import nltk
  from nltk.tokenize import sent_tokenize, word_tokenize
  from transformers import pipeline

  nltk.download('punkt')

  def calculate_flesch(text):
      sentences = sent_tokenize(text)
      words = word_tokenize(text)
      syllables = sum([count_syllables(word) for word in words])  # Define count_syllables separately
      return 206.835 - 1.015 * (len(words) / len(sentences)) - 84.6 * (syllables / len(words))

  def analyze_content(text):
      structure_score = check_imrad(text)  # Placeholder for IMRAD check
      clarity_score = calculate_flesch(text)
      quality_score = assess_quality(text)  # Placeholder for SciBERT-based quality
      return {"structure": structure_score, "clarity": clarity_score, "quality": quality_score}
  ```
- **Test**: Run on extracted text and verify scores.

### 4. Adapt "Deep-Research" Code
- **Goal**: Tailor "deep-research" for dental research.
- **Code**: In `deep-research/src/index.ts`, modify:
  ```typescript
  interface ResearchInput {
    paperText: string;
    depth: number;
    breadth: number;
  }

  function deepResearch(input: ResearchInput): Promise<string> {
    const queries = generateQueries(input.paperText, "dental research");
    // Existing logic for SERP queries, processing, and reporting
    return generateMarkdownReport(results);
  }
  ```
- **Test**: Run with sample text and check query output.

### 5. Integrate with Backend
- **Goal**: Hook "deep-research" into the pipeline.
- **Code**: Update `content_analysis.py`:
  ```python
  import os
  import subprocess
  from dotenv import load_dotenv

  load_dotenv(".env.local")

  def run_deep_research(text, depth=2, breadth=3):
      process = subprocess.run(
          ["node", "deep-research/dist/index.js", text, str(depth), str(breadth)],
          capture_output=True, text=True
      )
      return process.stdout

  def enhanced_content_analysis(text, deep_analysis=False):
      base_results = analyze_content(text)
      if deep_analysis:
          deep_results = run_deep_research(text)
          base_results["deep_research"] = deep_results
      return base_results
  ```
- **Test**: Run with `deep_analysis=True` and verify combined output.

### 6. Update UI with "Deep Analysis" Toggle
- **Goal**: Add an optional toggle in the frontend.
- **Code**: In `periospot-frontend/src/components/ContentAnalysis.js`:
  ```javascript
  import { useState } from 'react';

  function ContentAnalysis({ paperId }) {
    const [deepAnalysis, setDeepAnalysis] = useState(false);

    const analyze = async () => {
      const response = await fetch('/api/analyze-content', {
        method: 'POST',
        body: JSON.stringify({ paperId, deepAnalysis }),
      });
      const result = await response.json();
      console.log(result);
    };

    return (
      <div>
        <label>
          <input
            type="checkbox"
            checked={deepAnalysis}
            onChange={(e) => setDeepAnalysis(e.target.checked)}
          />
          Deep Analysis
        </label>
        <button onClick={analyze}>Analyze Content</button>
      </div>
    );
  }
  ```
- **Test**: Load UI, toggle "Deep Analysis," and verify backend response.

### 7. Generate Combined Report
- **Goal**: Produce a Markdown report.
- **Code**: In `content_analysis.py`:
  ```python
  def generate_report(results, paper_title):
      with open(f"{paper_title}_report.md", "w") as f:
          f.write(f"# Analysis Report: {paper_title}\n\n")
          f.write(f"## Internal Analysis\n- Structure: {results['structure']}\n- Clarity: {results['clarity']}\n- Quality: {results['quality']}\n")
          if "deep_research" in results:
              f.write(f"## Deep Research Findings\n{results['deep_research']}\n")
  ```
- **Test**: Generate report and verify contents.

## Testing and Debugging

### Test Cases
1. **Basic Content Analysis**:
   - **Input**: Upload a dental paper PDF (e.g., "Homogenized finite element simulations...").
   - **Expected Output**: Structure, clarity, and quality scores (e.g., "Clarity: Flesch score 65").
   - **Command**: `python content_analysis.py --input paper.pdf`
2. **Deep Analysis Integration**:
   - **Input**: Same paper with "Deep Analysis" enabled.
   - **Expected Output**: Combined report with internal scores and external findings.
   - **Command**: `python content_analysis.py --input paper.pdf --deep`
3. **API Failure**:
   - **Input**: Remove API keys from `.env.local`.
   - **Expected Output**: Error message for missing keys.
   - **Command**: Same as above, after clearing `.env.local`.

### Debugging Tips
- **PDF Parsing**: Log extracted text (`print(text)`) to check for errors.
- **API Errors**: Test keys with `curl -H "Authorization: Bearer $OPENAI_KEY" https://api.openai.com/v1/models`.
- **TypeScript**: Run `node deep-research/dist/index.js` manually to isolate issues.
- **UI**: Use browser dev tools (F12) to inspect fetch responses.

## Implementation Notes for Cursor AI
- Use Cursor AI to generate and refine code snippets (e.g., prompt: "Write a Python function to calculate Flesch score using NLTK").
- Test each step incrementally in your IDE's terminal or browser, logging outputs for verification.
- Commit changes after each step (`git commit -m "Step X completed"`) to track progress.

---
Last Updated: [Date] 
'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { DentalAnalysisResults } from '../components/DentalAnalysisResults';
import { TopicSelector } from '../components/TopicSelector';
import { Progress } from '../components/ui/progress';
import { FileText, Settings, BarChart2, Upload, X, Terminal } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { TopicAnalysis, ContentAnalysisResult } from '../types';

interface AnalysisSettings {
  deepAnalysis: boolean;
  depth: number;
  breadth: number;
}

interface AnalysisProgress {
  status: 'idle' | 'analyzing' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
}

interface AnalysisLog {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

interface ArticleMetadata {
  title: string;
  authors: Array<{
    firstName: string;
    lastName: string;
    name: string;
    affiliation?: string;
  }>;
  journal: string;
  publicationYear: number;
  abstract?: string;
  summary?: string;
}

type AnalysisResults = ContentAnalysisResult;

export default function ContentAnalysisPageDevelopment() {
  const [settings, setSettings] = useState<AnalysisSettings>({
    deepAnalysis: true,
    depth: 2,
    breadth: 3,
  });

  const [progress, setProgress] = useState<AnalysisProgress>({
    status: 'idle',
    progress: 0,
  });

  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<ArticleMetadata | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<AnalysisLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [topicAnalysis, setTopicAnalysis] = useState<TopicAnalysis | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setIsProcessing(true);
      setTopicAnalysis(null);
      setSelectedTopics([]);
      setAnalysisResults(null);
      
      try {
        // Read the file content
        const text = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(file);
        });

        // Extract metadata using development API
        const response = await fetch('http://localhost:3001/api/analyze/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error('Failed to extract metadata');
        }

        const extractedMetadata = await response.json();
        setMetadata(extractedMetadata);

        // Get initial topic analysis
        const topicsResponse = await fetch('http://localhost:3001/api/analyze/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text,
            options: {} 
          }),
        });

        if (!topicsResponse.ok) {
          throw new Error('Failed to extract topics');
        }

        const { topicAnalysis } = await topicsResponse.json();
        setTopicAnalysis(topicAnalysis);
      } catch (error) {
        console.error('Error processing file:', error);
        addLog(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      } finally {
        setIsProcessing(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const clearFile = () => {
    setSelectedFile(null);
    setMetadata(null);
  };

  const handleTopicsSelected = (topics: string[]) => {
    setSelectedTopics(topics);
    addLog(`Selected ${topics.length} topics for analysis`, 'info');
  };

  const startAnalysis = async () => {
    if (!selectedFile || !selectedTopics.length) return;

    setProgress({ status: 'analyzing', progress: 0, currentStep: 'Initializing analysis...' });
    clearLogs();
    setShowLogs(true);
    
    try {
      addLog('Starting file analysis', 'info');
      
      // First read the file as ArrayBuffer
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        addLog('Reading file content...', 'info');
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = (e) => {
          addLog('Error reading file', 'error');
          reject(new Error('Failed to read file'));
        };
        reader.readAsArrayBuffer(selectedFile);
      });

      addLog('File content read successfully', 'success');
      
      // Convert ArrayBuffer to text using pdf-parse
      const formData = new FormData();
      formData.append('file', new Blob([arrayBuffer]));
      
      // Extract text from PDF
      addLog('Extracting text from PDF...', 'info');
      const textResponse = await fetch('http://localhost:3001/api/parse/pdf', {
        method: 'POST',
        body: formData
      });

      if (!textResponse.ok) {
        throw new Error('Failed to extract text from PDF');
      }

      const { text } = await textResponse.json();
      addLog(`Extracted ${text.length} characters of text`, 'success');

      // Start analysis with 20% progress
      setProgress({
        status: 'analyzing',
        progress: 20,
        currentStep: 'Analyzing content structure...'
      });

      addLog('Sending analysis request to API', 'info');
      addLog(`Analysis options: ${JSON.stringify({
        deepAnalysis: settings.deepAnalysis,
        depth: settings.depth,
        breadth: settings.breadth,
        selectedTopics
      })}`, 'info');

      // Call the analysis API with settings
      const response = await fetch('http://localhost:3001/api/analyze/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          options: {
            deepAnalysis: settings.deepAnalysis,
            depth: settings.depth,
            breadth: settings.breadth,
            selectedTopics
          }
        })
      });

      addLog(`Received API response (status: ${response.status})`, 'info');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        addLog(`API error: ${errorData.error || 'Unknown error'}`, 'error');
        throw new Error(errorData.error || 'Analysis failed');
      }

      // Update progress to 60%
      setProgress({
        status: 'analyzing',
        progress: 60,
        currentStep: settings.deepAnalysis ? 'Performing deep analysis...' : 'Finalizing analysis...'
      });

      const rawResults = await response.json();
      
      // Ensure all required fields are present with proper types
      const safeAnalysisResults: ContentAnalysisResult = {
        analysisComplete: true,
        selectedTopics,
        analysis: {
          studyType: rawResults.analysis.studyType || '',
          methodology: {
            type: rawResults.analysis.methodology.type || '',
            description: rawResults.analysis.methodology.description || '',
            concerns: rawResults.analysis.methodology.concerns || []
          },
          statistics: {
            methods: rawResults.analysis.statistics.methods || [],
            appropriateness: rawResults.analysis.statistics.appropriateness || false,
            concerns: rawResults.analysis.statistics.concerns || []
          },
          clinicalRelevance: {
            score: rawResults.analysis.clinicalRelevance.score || 0,
            explanation: rawResults.analysis.clinicalRelevance.explanation || '',
            implications: rawResults.analysis.clinicalRelevance.implications || []
          },
          evidenceLevel: {
            level: rawResults.analysis.evidenceLevel.level || '',
            description: rawResults.analysis.evidenceLevel.description || ''
          },
          perio: {
            relevantConditions: rawResults.analysis.perio.relevantConditions || [],
            treatments: rawResults.analysis.perio.treatments || [],
            outcomes: rawResults.analysis.perio.outcomes || []
          }
        },
        statisticalValidation: {
          isValid: rawResults.statisticalValidation.isValid || false,
          concerns: rawResults.statisticalValidation.concerns || [],
          suggestions: rawResults.statisticalValidation.suggestions || []
        },
        perioRelevance: {
          relevanceScore: rawResults.perioRelevance.relevanceScore || 0,
          conditions: rawResults.perioRelevance.conditions || [],
          clinicalImplications: rawResults.perioRelevance.clinicalImplications || [],
          researchGaps: rawResults.perioRelevance.researchGaps || []
        },
        methodologyQuality: {
          score: rawResults.methodologyQuality.score || 0,
          strengths: rawResults.methodologyQuality.strengths || [],
          weaknesses: rawResults.methodologyQuality.weaknesses || [],
          recommendations: rawResults.methodologyQuality.recommendations || []
        }
      };

      addLog('Analysis completed successfully', 'success');

      // Complete the analysis
      setProgress({ status: 'complete', progress: 100 });
      setAnalysisResults(safeAnalysisResults);
    } catch (error: any) {
      addLog(`Analysis failed: ${error.message}`, 'error');
      setProgress({ 
        status: 'error', 
        progress: 0,
        currentStep: `Error: ${error.message || 'Unknown error occurred'}`
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex">
      <div className="flex-1 max-w-4xl">
        <h1 className="text-3xl font-bold text-periospot-blue-strong mb-8">
          Content Analysis (Development)
        </h1>

        {/* Upload Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Paper
            </CardTitle>
            <CardDescription>
              Upload a dental research paper in PDF format for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!selectedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-periospot-blue-strong bg-periospot-blue-strong/5'
                      : 'border-gray-300 hover:border-periospot-blue-strong'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                  {isDragActive ? (
                    <p>Drop the PDF here...</p>
                  ) : (
                    <p>Drag & drop a PDF here, or click to select</p>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-periospot-blue-strong" />
                      <span className="font-medium">{selectedFile.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearFile}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  {isProcessing ? (
                    <div className="mt-4">
                      <Progress value={50} className="mb-2" />
                      <p className="text-sm text-center text-muted-foreground">
                        Extracting metadata...
                      </p>
                    </div>
                  ) : metadata ? (
                    <div className="mt-4 space-y-4">
                      {metadata.title && (
                        <h3 className="text-2xl font-semibold text-primary">
                          {metadata.title}
                        </h3>
                      )}
                      {metadata.authors && metadata.authors.length > 0 && (
                        <p className="text-sm text-gray-600">
                          {metadata.authors.map((author, index) => (
                            <span key={index}>
                              {author.name}
                              {author.affiliation && ` (${author.affiliation})`}
                              {index < metadata.authors.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </p>
                      )}
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-bold">
                          Journal: <span className="font-normal">Frontiers in Endocrinology</span>
                        </p>
                        <p className="font-bold">
                          Year of publication: <span className="font-normal">2023</span>
                        </p>
                      </div>
                      {metadata.abstract && (
                        <div className="mt-4">
                          <h4 className="font-bold text-gray-700 mb-2">Abstract</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {metadata.abstract}
                          </p>
                        </div>
                      )}
                      
                      {/* Paper Summary Section */}
                      {metadata.summary && (
                        <div className="mt-6 bg-white rounded-lg p-6 border border-gray-200">
                          <h4 className="text-lg font-bold text-gray-800 mb-4">Paper Summary</h4>
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {metadata.summary}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Topic Selection */}
        {topicAnalysis && !analysisResults && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <TopicSelector
                topicAnalysis={topicAnalysis}
                onTopicsSelected={handleTopicsSelected}
              />
            </CardContent>
          </Card>
        )}

        {/* Settings Card - Only show after topics are selected */}
        {selectedTopics.length > 0 && !analysisResults && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Analysis Settings
              </CardTitle>
              <CardDescription>
                Configure how you want to analyze your dental research paper
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Deep Analysis Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Deep Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Enable comprehensive analysis with external source validation
                    </p>
                  </div>
                  <Switch
                    checked={settings.deepAnalysis}
                    onCheckedChange={(checked: boolean) => 
                      setSettings(prev => ({ ...prev, deepAnalysis: checked }))
                    }
                  />
                </div>

                {/* Analysis Depth */}
                {settings.deepAnalysis && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Analysis Depth</h3>
                        <span className="text-sm">{settings.depth}</span>
                      </div>
                      <Slider
                        value={[settings.depth]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={([value]: number[]) => 
                          setSettings(prev => ({ ...prev, depth: value }))
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        Higher depth means more thorough analysis but takes longer
                      </p>
                    </div>

                    {/* Analysis Breadth */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Analysis Breadth</h3>
                        <span className="text-sm">{settings.breadth}</span>
                      </div>
                      <Slider
                        value={[settings.breadth]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={([value]: number[]) => 
                          setSettings(prev => ({ ...prev, breadth: value }))
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        Higher breadth means more sources are checked but takes longer
                      </p>
                    </div>
                  </>
                )}

                <Button
                  className="w-full"
                  onClick={startAnalysis}
                  disabled={!selectedFile || progress.status === 'analyzing'}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Start Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Card */}
        {progress.status === 'analyzing' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                Analysis Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={progress.progress} />
                <p className="text-sm text-center text-muted-foreground">
                  {progress.currentStep}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {progress.status === 'complete' && analysisResults && (
          <DentalAnalysisResults
            analysis={analysisResults.analysis}
            statisticalValidation={analysisResults.statisticalValidation}
            perioRelevance={analysisResults.perioRelevance}
            methodologyQuality={analysisResults.methodologyQuality}
          />
        )}

        {/* Error State */}
        {progress.status === 'error' && (
          <Card className="border-red-500">
            <CardHeader>
              <CardTitle className="text-red-500">Analysis Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{progress.currentStep}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lateral Progress Window */}
      {showLogs && (
        <div className="w-96 ml-8 sticky top-8 self-start">
          <Card className="bg-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-md font-medium">
                <Terminal className="h-4 w-4 inline-block mr-2" />
                Analysis Logs
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogs(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-[600px] overflow-y-auto bg-white rounded-md p-4 font-mono text-sm">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`mb-2 ${
                        log.type === 'error'
                          ? 'text-red-600'
                          : log.type === 'success'
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }`}
                    >
                      <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                    </div>
                  ))}
                </div>
                {progress.status === 'analyzing' && (
                  <div className="space-y-2">
                    <Progress value={progress.progress} />
                    <p className="text-sm text-center text-muted-foreground">
                      {progress.currentStep}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 
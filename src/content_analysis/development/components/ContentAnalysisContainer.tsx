import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopicSelector } from './TopicSelector';
import { AnalysisProgress } from './AnalysisProgress';
import { DentalAnalysisResults } from './DentalAnalysisResults';
import { TopicAnalysis, ContentAnalysisResult, ResearchProgress } from '../types';

interface ContentAnalysisContainerProps {
  file: File | null;
  metadata: any;
  onAnalysisComplete?: (result: ContentAnalysisResult) => void;
}

export const ContentAnalysisContainer: React.FC<ContentAnalysisContainerProps> = ({
  file,
  metadata,
  onAnalysisComplete
}) => {
  const [topicAnalysis, setTopicAnalysis] = useState<TopicAnalysis | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState<ResearchProgress | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ContentAnalysisResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [logs, setLogs] = useState<Array<{ type: string; message: string; timestamp: string }>>([]);

  const addLog = (type: string, message: string) => {
    setLogs(prev => [...prev, {
      type,
      message,
      timestamp: new Date().toISOString()
    }]);
  };

  useEffect(() => {
    if (file) {
      startInitialAnalysis();
    }
  }, [file]);

  const startInitialAnalysis = async () => {
    try {
      addLog('info', 'Starting initial analysis to extract topics');
      
      const formData = new FormData();
      formData.append('file', file!);
      
      const response = await fetch('/api/analyze/content', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const result = await response.json();
      addLog('success', 'Successfully extracted topics from content');
      setTopicAnalysis(result.topicAnalysis);
    } catch (error) {
      addLog('error', `Error in initial analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTopicsSelected = async (topics: string[]) => {
    setSelectedTopics(topics);
    addLog('info', `Starting deep analysis for ${topics.length} selected topics`);
    
    try {
      const formData = new FormData();
      formData.append('file', file!);
      formData.append('options', JSON.stringify({
        selectedTopics: topics,
        deepAnalysis: true
      }));

      const response = await fetch('/api/analyze/content', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to perform deep analysis');
      }

      const result = await response.json();
      setAnalysisResult(result);
      onAnalysisComplete?.(result);
      addLog('success', 'Deep analysis completed successfully');
    } catch (error) {
      addLog('error', `Error in deep analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleProgressUpdate = (progress: ResearchProgress) => {
    setAnalysisProgress(progress);
    addLog('info', `Analysis progress: ${progress.completedQueries}/${progress.totalQueries} queries completed`);
  };

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {topicAnalysis && !analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <TopicSelector
              topicAnalysis={topicAnalysis}
              onTopicsSelected={handleTopicsSelected}
            />
          </motion.div>
        )}

        {analysisProgress && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AnalysisProgress
              progress={analysisProgress}
              showDetails={showDetails}
              onToggleDetails={() => setShowDetails(!showDetails)}
            />
          </motion.div>
        )}

        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <DentalAnalysisResults
              analysis={analysisResult.analysis}
              statisticalValidation={analysisResult.statisticalValidation}
              perioRelevance={analysisResult.perioRelevance}
              methodologyQuality={analysisResult.methodologyQuality}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logging Panel */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 right-0 w-96 bg-gray-900 text-white p-4 rounded-tl-lg shadow-lg"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold">Analysis Logs</h3>
          <button
            onClick={() => setLogs([])}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
        <div className="h-64 overflow-y-auto text-xs space-y-1">
          {logs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={`py-1 ${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                'text-gray-300'
              }`}
            >
              <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
              {log.message}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}; 
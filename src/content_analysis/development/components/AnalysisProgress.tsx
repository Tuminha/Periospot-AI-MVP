import React from 'react';
import { ResearchProgress } from '../types';

interface AnalysisProgressProps {
  progress: ResearchProgress;
  showDetails: boolean;
  onToggleDetails: () => void;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ 
  progress, 
  showDetails,
  onToggleDetails 
}) => {
  const percentComplete = progress.totalQueries 
    ? Math.round((progress.completedQueries / progress.totalQueries) * 100)
    : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Analysis Progress</h2>
        <button
          onClick={onToggleDetails}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Processing queries...</span>
          <span>{percentComplete}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-300">Current Progress</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Depth</p>
                <p className="text-white">{progress.currentDepth} / {progress.totalDepth}</p>
              </div>
              <div>
                <p className="text-gray-400">Breadth</p>
                <p className="text-white">{progress.currentBreadth} / {progress.totalBreadth}</p>
              </div>
              <div>
                <p className="text-gray-400">Queries Completed</p>
                <p className="text-white">{progress.completedQueries} / {progress.totalQueries || '?'}</p>
              </div>
            </div>
          </div>

          {progress.currentStep && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">Current Step</h3>
              <p className="text-white">{progress.currentStep}</p>
              {progress.stepDetails && (
                <p className="text-sm text-gray-400">{progress.stepDetails}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 
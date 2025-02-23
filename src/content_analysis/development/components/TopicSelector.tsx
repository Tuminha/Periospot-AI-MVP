import React from 'react';
import { TopicAnalysis } from '../types';

interface TopicSelectorProps {
  topicAnalysis: TopicAnalysis;
  onTopicsSelected: (selectedIds: string[]) => void;
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({ topicAnalysis, onTopicsSelected }) => {
  const [selectedTopics, setSelectedTopics] = React.useState<Set<string>>(new Set());

  const handleTopicToggle = (id: string) => {
    const newSelected = new Set(selectedTopics);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTopics(newSelected);
    onTopicsSelected(Array.from(newSelected));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Paper Summary</h2>
        <p className="text-gray-300">{topicAnalysis.summary}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Select Topics to Analyze</h2>
        <p className="text-gray-400 text-sm">Choose the aspects of the paper you'd like to analyze in depth.</p>
        
        <div className="space-y-3">
          {topicAnalysis.topics.map((topic) => (
            <div key={topic.id} className="flex items-start space-x-3">
              <div className="flex items-center h-6">
                <input
                  type="checkbox"
                  id={topic.id}
                  checked={selectedTopics.has(topic.id)}
                  onChange={() => handleTopicToggle(topic.id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <label htmlFor={topic.id} className="font-medium text-white select-none">
                  {topic.title}
                </label>
                <p className="text-gray-400">{topic.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={() => onTopicsSelected(Array.from(selectedTopics))}
          disabled={selectedTopics.size === 0}
          className={`w-full rounded-md px-4 py-2 text-sm font-semibold shadow-sm
            ${selectedTopics.size === 0 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-500'}`}
        >
          Analyze Selected Topics ({selectedTopics.size})
        </button>
      </div>
    </div>
  );
}; 
import React from 'react';
import { motion } from 'framer-motion';

interface DentalAnalysisResultsProps {
  analysis?: {
    studyType: string;
    methodology: {
      type: string;
      description: string;
      concerns: string[];
    };
    statistics: {
      methods: string[];
      appropriateness: boolean;
      concerns: string[];
    };
    clinicalRelevance: {
      score: number;
      explanation: string;
      implications: string[];
    };
    evidenceLevel: {
      level: string;
      description: string;
    };
    perio: {
      relevantConditions: string[];
      treatments: string[];
      outcomes: string[];
    };
  };
  statisticalValidation?: {
    isValid: boolean;
    concerns: string[];
    suggestions: string[];
  };
  perioRelevance?: {
    relevanceScore: number;
    conditions: string[];
    clinicalImplications: string[];
    researchGaps: string[];
  };
  methodologyQuality?: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <motion.div
    {...fadeInUp}
    className="bg-gray-800 rounded-lg p-6 space-y-4"
  >
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    {children}
  </motion.div>
);

const ScoreIndicator: React.FC<{ score: number; label: string }> = ({ score, label }) => (
  <div className="flex items-center space-x-2">
    <div className="relative w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`absolute h-full rounded-full ${
          score >= 80 ? 'bg-green-500' :
          score >= 60 ? 'bg-yellow-500' :
          'bg-red-500'
        }`}
      />
    </div>
    <span className="text-sm text-gray-400">{label}</span>
  </div>
);

const List: React.FC<{ items: string[]; type?: 'success' | 'warning' | 'error' }> = ({ 
  items, 
  type = 'success' 
}) => (
  <ul className="space-y-2">
    {items.map((item, index) => (
      <motion.li
        key={index}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className={`flex items-start space-x-2 text-sm ${
          type === 'success' ? 'text-green-400' :
          type === 'warning' ? 'text-yellow-400' :
          'text-red-400'
        }`}
      >
        <span>•</span>
        <span>{item}</span>
      </motion.li>
    ))}
  </ul>
);

export const DentalAnalysisResults: React.FC<DentalAnalysisResultsProps> = ({
  analysis,
  statisticalValidation,
  perioRelevance,
  methodologyQuality
}) => {
  if (!analysis || !statisticalValidation || !perioRelevance || !methodologyQuality) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-white text-center">Analysis data is not available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section title="Study Overview">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400">Study Type</p>
            <p className="text-white">{analysis.studyType || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Evidence Level</p>
            <p className="text-white">{analysis.evidenceLevel?.level || 'Not specified'}</p>
            <p className="text-sm text-gray-500">{analysis.evidenceLevel?.description || 'No description available'}</p>
          </div>
        </div>
      </Section>

      <Section title="Methodology Analysis">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Type</p>
            <p className="text-white">{analysis.methodology?.type || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Description</p>
            <p className="text-white">{analysis.methodology?.description || 'No description available'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Quality Assessment</p>
            <ScoreIndicator score={methodologyQuality.score || 0} label={`${methodologyQuality.score || 0}%`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Strengths</p>
              <List items={methodologyQuality.strengths || []} type="success" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Weaknesses</p>
              <List items={methodologyQuality.weaknesses || []} type="error" />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Statistical Analysis">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-2">Methods Used</p>
            <List items={analysis.statistics?.methods || []} />
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Validation</p>
            <div className={`text-sm ${statisticalValidation.isValid ? 'text-green-400' : 'text-red-400'}`}>
              {statisticalValidation.isValid ? 'Valid Statistical Analysis' : 'Statistical Concerns Detected'}
            </div>
            {(statisticalValidation.concerns || []).length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-400 mb-2">Concerns</p>
                <List items={statisticalValidation.concerns} type="warning" />
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section title="Periodontal Relevance">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-2">Relevance Score</p>
            <ScoreIndicator score={perioRelevance.relevanceScore || 0} label={`${perioRelevance.relevanceScore || 0}%`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Relevant Conditions</p>
              <List items={analysis.perio?.relevantConditions || []} />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Treatments</p>
              <List items={analysis.perio?.treatments || []} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Clinical Implications</p>
            <List items={perioRelevance.clinicalImplications || []} type="success" />
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Research Gaps</p>
            <List items={perioRelevance.researchGaps || []} type="warning" />
          </div>
        </div>
      </Section>
    </div>
  ); 
}; 
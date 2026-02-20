'use client';

import { useState, useEffect } from 'react';

interface ProgressIndicatorProps {
  stage: string;
  progress: number;
}

// Pipeline stages with descriptions
const PIPELINE_STAGES = [
  { id: 1, label: 'Search & Scrape', description: 'Searching Google and scraping top 5 competitor pages' },
  { id: 2, label: 'Intent Analysis', description: 'Analyzing search intent and user goals' },
  { id: 3, label: 'Competitor Analysis', description: 'Analyzing competitor page structure and content' },
  { id: 4, label: 'Screenshot Capture', description: 'Capturing visual examples of key elements' },
  { id: 5, label: 'Pattern Detection', description: 'Identifying common patterns across top rankers' },
  { id: 6, label: 'AI Detection', description: 'Analyzing content for AI-generated patterns' },
  { id: 7, label: 'Recommendations', description: 'Generating actionable recommendations' },
];

// Map progress percentage to current stage
function getActiveStageIndex(progress: number): number {
  if (progress <= 10) return 0;
  if (progress <= 30) return 1;
  if (progress <= 50) return 2;
  if (progress <= 55) return 3;
  if (progress <= 60) return 4;
  if (progress <= 75) return 5;
  return 6;
}

export default function ProgressIndicator({ stage, progress }: ProgressIndicatorProps) {
  const [dots, setDots] = useState('');
  const activeStageIndex = getActiveStageIndex(progress);
  const activeStage = PIPELINE_STAGES[activeStageIndex];

  // Animated dots for "working" indication
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Header with spinner */}
        <div className="flex items-center space-x-3 mb-4">
          <Spinner />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Analyzing{dots}
          </h3>
        </div>

        {/* Current activity description */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <PulsingDot />
            </div>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {activeStage?.label || stage}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {activeStage?.description || 'Processing...'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style={{ width: `${Math.max(progress, 5)}%` }}
          >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Progress percentage */}
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-6">
          {progress}% complete
        </p>

        {/* Stages list */}
        <div className="space-y-3">
          {PIPELINE_STAGES.map((pipelineStage, index) => (
            <StageItem
              key={pipelineStage.id}
              completed={index < activeStageIndex}
              active={index === activeStageIndex}
              label={pipelineStage.label}
              description={pipelineStage.description}
            />
          ))}
        </div>

        {/* Helpful message */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            This typically takes 30-60 seconds depending on page complexity
          </p>
        </div>
      </div>
    </div>
  );
}

function StageItem({
  completed,
  active,
  label,
  description,
}: {
  completed: boolean;
  active: boolean;
  label: string;
  description: string;
}) {
  return (
    <div className={`flex items-start space-x-3 ${active ? 'bg-gray-50 dark:bg-gray-700/50 -mx-2 px-2 py-2 rounded-lg' : ''}`}>
      <div className="flex-shrink-0 mt-0.5">
        {completed ? (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        ) : active ? (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <SmallSpinner />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm ${
            completed
              ? 'text-green-700 dark:text-green-400 font-medium'
              : active
              ? 'text-blue-700 dark:text-blue-300 font-medium'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {label}
        </span>
        {active && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

function SmallSpinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

function PulsingDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
    </span>
  );
}

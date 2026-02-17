'use client';

interface ProgressIndicatorProps {
  stage: string;
  progress: number;
}

export default function ProgressIndicator({ stage, progress }: ProgressIndicatorProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Analyzing...
        </h3>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current stage */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {stage}
        </p>

        {/* Progress percentage */}
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {progress}% complete
        </p>

        {/* Stages list */}
        <div className="mt-6 space-y-2">
          <StageItem completed={progress > 10} active={progress <= 30} label="1. Search & Scrape" />
          <StageItem completed={progress > 30} active={progress > 30 && progress <= 50} label="2. Intent Analysis" />
          <StageItem completed={progress > 50} active={progress > 50 && progress <= 70} label="3. Competitor Analysis" />
          <StageItem completed={progress > 70} active={progress > 70 && progress <= 90} label="4. Pattern Detection" />
          <StageItem completed={progress > 90} active={progress > 90} label="5. Recommendations" />
        </div>
      </div>
    </div>
  );
}

function StageItem({ completed, active, label }: { completed: boolean; active: boolean; label: string }) {
  return (
    <div className="flex items-center space-x-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center ${
          completed
            ? 'bg-green-500'
            : active
            ? 'bg-blue-500 animate-pulse'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        {completed && (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <span
        className={`text-sm ${
          completed || active
            ? 'text-gray-900 dark:text-gray-100 font-medium'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

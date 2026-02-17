'use client';

import { useState } from 'react';
import { LLMModel } from '@/lib/llm/types';
import ModelSelector from './ModelSelector';

interface AnalysisFormProps {
  onSubmit: (keyword: string, targetUrl: string, model: LLMModel) => void;
  isAnalyzing: boolean;
}

export default function AnalysisForm({ onSubmit, isAnalyzing }: AnalysisFormProps) {
  const [keyword, setKeyword] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [model, setModel] = useState<LLMModel>('claude-sonnet-4-5');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(keyword, targetUrl, model);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6">
      {/* Keyword Input */}
      <div>
        <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Target Keyword
        </label>
        <input
          type="text"
          id="keyword"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="e.g., best project management software"
          required
          disabled={isAnalyzing}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Enter the keyword you want to rank for
        </p>
      </div>

      {/* Target URL Input */}
      <div>
        <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Page URL
        </label>
        <input
          type="url"
          id="targetUrl"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          placeholder="https://example.com/your-page"
          required
          disabled={isAnalyzing}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          The page you want to optimize for this keyword
        </p>
      </div>

      {/* Model Selector */}
      <ModelSelector value={model} onChange={setModel} />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isAnalyzing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnalyzing ? 'Analyzing...' : 'Analyze SEO Intent'}
      </button>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How it works:</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Analyzes top 5 Google results for your keyword</li>
          <li>• Identifies search intent and ranking patterns</li>
          <li>• Compares your page against competitors</li>
          <li>• Provides actionable recommendations</li>
        </ul>
      </div>
    </form>
  );
}

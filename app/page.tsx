'use client';

import { useState } from 'react';
import { LLMModel } from '@/lib/llm/types';
import AnalysisForm from '@/components/AnalysisForm';
import ProgressIndicator from '@/components/ProgressIndicator';
import ResultsDisplay from '@/components/ResultsDisplay';

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [result, setResult] = useState<{ markdown: string; keyword: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ keyword: '', targetUrl: '', model: 'claude-sonnet-4-5' as LLMModel });

  const handleAnalyze = async (keyword: string, targetUrl: string, model: LLMModel) => {
    setIsAnalyzing(true);
    setProgress(0);
    setStage('Starting analysis...');
    setResult(null);
    setError(null);
    setFormData({ keyword, targetUrl, model });

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword,
          targetUrl,
          model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      // Check if it's an SSE stream
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // Handle SSE stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Failed to read response stream');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete events in the buffer
          // SSE events are separated by double newlines
          const events = buffer.split('\n\n');

          // Keep the last part in buffer (might be incomplete)
          buffer = events.pop() || '';

          for (const eventBlock of events) {
            if (!eventBlock.trim()) continue;

            const lines = eventBlock.split('\n');
            let currentEvent = '';
            let currentData = '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.slice(7);
              } else if (line.startsWith('data: ')) {
                currentData = line.slice(6);
              }
            }

            if (currentEvent && currentData) {
              try {
                const data = JSON.parse(currentData);

                if (currentEvent === 'progress') {
                  setProgress(data.progress);
                  setStage(data.stage);
                } else if (currentEvent === 'complete') {
                  setProgress(100);
                  setStage('Complete!');
                  setResult({
                    markdown: data.report.markdown,
                    keyword,
                  });
                } else if (currentEvent === 'error') {
                  throw new Error(data.error || 'Analysis failed');
                }
              } catch (parseError) {
                console.error('Failed to parse SSE data:', parseError, currentData.slice(0, 200));
              }
            }
          }
        }
      } else {
        // Fallback for non-SSE response
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Analysis failed');
        }
        setProgress(100);
        setStage('Complete!');
        setResult({
          markdown: data.report.markdown,
          keyword,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            SEO Intent Analyzer
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Analyze search intent and get actionable recommendations to rank #1
          </p>
        </div>

        {/* Form - Show unless we have results */}
        {!result && (
          <AnalysisForm onSubmit={handleAnalyze} isAnalyzing={isAnalyzing} />
        )}

        {/* Progress */}
        {isAnalyzing && <ProgressIndicator stage={stage} progress={progress} />}

        {/* Error */}
        {error && !result && (
          <div className="w-full max-w-2xl mx-auto mt-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                Error
              </h3>
              <p className="text-red-800 dark:text-red-200 mb-2">{error}</p>
              <details className="text-sm text-red-700 dark:text-red-300 mb-4">
                <summary className="cursor-pointer hover:underline">View details</summary>
                <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded font-mono text-xs break-all">
                  {error}
                </div>
              </details>
              <button
                onClick={() => {
                  setError(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <ResultsDisplay
            markdown={result.markdown}
            keyword={result.keyword}
            onReanalyze={() => handleAnalyze(formData.keyword, formData.targetUrl, formData.model)}
          />
        )}
      </div>
    </div>
  );
}

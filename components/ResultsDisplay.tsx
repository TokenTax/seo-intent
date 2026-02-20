'use client';

import { useState, useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface ResultsDisplayProps {
  markdown: string;
  keyword: string;
  onReanalyze?: () => void;
}

export default function ResultsDisplay({ markdown, keyword, onReanalyze }: ResultsDisplayProps) {
  const [copied, setCopied] = useState(false);

  // Allow data: URIs for base64 images (react-markdown v9 blocks them by default)
  const urlTransform = (url: string) => {
    // Allow data: URIs (base64 images)
    if (url.startsWith('data:')) {
      return url;
    }
    // Allow http/https URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Allow relative URLs
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return url;
    }
    // Block other protocols for security
    return '';
  };

  // Custom components for ReactMarkdown to handle images in details
  const components: Components = useMemo(() => ({
    img: ({ src, alt, ...props }) => (
      <img
        src={src}
        alt={alt || ''}
        style={{
          maxWidth: '100%',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          marginTop: '8px',
          display: 'block',
        }}
        {...props}
      />
    ),
    details: ({ children, ...props }) => (
      <details
        style={{
          marginTop: '8px',
          marginBottom: '16px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
        {...props}
      >
        {children}
      </details>
    ),
    summary: ({ children, ...props }) => (
      <summary
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          backgroundColor: '#f9fafb',
          fontWeight: 500,
          fontSize: '14px',
          color: '#6366f1',
        }}
        {...props}
      >
        {children}
      </summary>
    ),
  }), []);

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-analysis-${keyword.replace(/\s+/g, '-')}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy markdown:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = markdown;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      {/* Action buttons */}
      <div className="flex justify-end mb-4 space-x-4">
        <button
          onClick={handleCopyMarkdown}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>Copy Markdown</span>
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Download Report</span>
        </button>

        {onReanalyze && (
          <button
            onClick={onReanalyze}
            className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Reanalyze</span>
          </button>
        )}

        <button
          onClick={() => window.location.reload()}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>New Analysis</span>
        </button>
      </div>

      {/* Markdown content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="markdown-body prose dark:prose-invert max-w-none">
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            components={components}
            urlTransform={urlTransform}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

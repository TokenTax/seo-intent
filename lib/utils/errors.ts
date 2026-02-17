/**
 * Custom error classes for better error handling
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SerpAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SerpAPIError';
  }
}

export class ScraperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScraperError';
  }
}

export class LLMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMError';
  }
}

export class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown): { error: string; type: string } {
  if (error instanceof ValidationError) {
    return { error: error.message, type: 'validation' };
  }
  if (error instanceof SerpAPIError) {
    return { error: error.message, type: 'search' };
  }
  if (error instanceof ScraperError) {
    return { error: error.message, type: 'scraper' };
  }
  if (error instanceof LLMError) {
    return { error: error.message, type: 'llm' };
  }
  if (error instanceof AnalysisError) {
    return { error: error.message, type: 'analysis' };
  }
  if (error instanceof Error) {
    return { error: error.message, type: 'unknown' };
  }
  return { error: 'An unknown error occurred', type: 'unknown' };
}

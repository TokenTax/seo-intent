import { ValidationError } from './errors';
import { LLMModel } from '../llm/types';

/**
 * Validate URL format
 */
export function validateUrl(url: string): void {
  if (!url || url.trim().length === 0) {
    throw new ValidationError('URL is required');
  }

  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new ValidationError('URL must use http or https protocol');
    }
  } catch {
    throw new ValidationError('Invalid URL format');
  }
}

/**
 * Validate keyword
 */
export function validateKeyword(keyword: string): void {
  if (!keyword || keyword.trim().length === 0) {
    throw new ValidationError('Keyword is required');
  }

  if (keyword.length > 200) {
    throw new ValidationError('Keyword is too long (max 200 characters)');
  }
}

/**
 * Validate model
 */
export function validateModel(model: string): model is LLMModel {
  const validModels = [
    'claude-opus-4-5',
    'claude-sonnet-4-5',
    'claude-haiku-4-5',
    'gpt-4',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
  ];

  if (!validModels.includes(model)) {
    throw new ValidationError(`Invalid model: ${model}`);
  }

  return true;
}

/**
 * Validate analysis request
 */
export interface AnalysisRequest {
  keyword: string;
  targetUrl: string;
  model: LLMModel;
}

export function validateAnalysisRequest(data: any): AnalysisRequest {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid request body');
  }

  validateKeyword(data.keyword);
  validateUrl(data.targetUrl);
  validateModel(data.model);

  return {
    keyword: data.keyword.trim(),
    targetUrl: data.targetUrl.trim(),
    model: data.model,
  };
}

import { LLMProvider } from './base';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { LLMModel, AnthropicModel, OpenAIModel } from '../types';

/**
 * Determine if a model is an Anthropic model
 */
function isAnthropicModel(model: LLMModel): model is AnthropicModel {
  return model.startsWith('claude-');
}

/**
 * Determine if a model is an OpenAI model
 */
function isOpenAIModel(model: LLMModel): model is OpenAIModel {
  return model.startsWith('gpt-');
}

/**
 * Factory function to create the appropriate LLM provider
 */
export function createLLMProvider(model: LLMModel): LLMProvider {
  if (isAnthropicModel(model)) {
    return new AnthropicProvider(model);
  } else if (isOpenAIModel(model)) {
    return new OpenAIProvider(model);
  } else {
    throw new Error(`Unsupported model: ${model}`);
  }
}

/**
 * Get a list of all supported models
 */
export function getSupportedModels(): { anthropic: AnthropicModel[]; openai: OpenAIModel[] } {
  return {
    anthropic: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
    openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  };
}

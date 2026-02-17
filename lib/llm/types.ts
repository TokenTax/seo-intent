export type LLMProviderType = 'anthropic' | 'openai';

export type AnthropicModel = 'claude-opus-4-5' | 'claude-sonnet-4-5' | 'claude-haiku-4-5';
export type OpenAIModel = 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
export type LLMModel = AnthropicModel | OpenAIModel;

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  tokensUsed?: number;
}

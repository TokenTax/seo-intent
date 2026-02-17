import OpenAI from 'openai';
import { LLMProvider } from './base';
import { LLMOptions, LLMResponse, OpenAIModel } from '../types';

/**
 * OpenAI GPT provider
 */
export class OpenAIProvider extends LLMProvider {
  private client: OpenAI;

  constructor(model: OpenAIModel, apiKey?: string) {
    super(model);

    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    this.client = new OpenAI({ apiKey: key });
  }

  async generate(prompt: string, options: LLMOptions = {}): Promise<LLMResponse> {
    console.log(`[OpenAI] Generating with model: ${this.model}`);

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: prompt,
      });

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 4096,
      });

      const choice = completion.choices[0];
      if (!choice || !choice.message || !choice.message.content) {
        throw new Error('Invalid response from OpenAI');
      }

      return {
        content: choice.message.content,
        model: this.model,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error('OpenAI API error: Unknown error');
    }
  }
}

import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider } from './base';
import { LLMOptions, LLMResponse, AnthropicModel } from '../types';

/**
 * Anthropic Claude provider
 */
export class AnthropicProvider extends LLMProvider {
  private client: Anthropic;

  constructor(model: AnthropicModel, apiKey?: string) {
    super(model);

    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    this.client = new Anthropic({ apiKey: key });
  }

  async generate(prompt: string, options: LLMOptions = {}): Promise<LLMResponse> {
    console.log(`[Anthropic] Generating with model: ${this.model}`);

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
        system: options.systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return {
        content: content.text,
        model: this.model,
        tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Anthropic API error: ${error.message}`);
      }
      throw new Error('Anthropic API error: Unknown error');
    }
  }
}

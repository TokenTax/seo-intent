import { LLMOptions, LLMResponse, LLMModel } from '../types';

/**
 * Abstract base class for LLM providers
 */
export abstract class LLMProvider {
  protected model: LLMModel;

  constructor(model: LLMModel) {
    this.model = model;
  }

  /**
   * Generate a response from the LLM
   */
  abstract generate(prompt: string, options?: LLMOptions): Promise<LLMResponse>;

  /**
   * Get the current model being used
   */
  getModel(): LLMModel {
    return this.model;
  }

  /**
   * Set a different model
   */
  setModel(model: LLMModel): void {
    this.model = model;
  }
}

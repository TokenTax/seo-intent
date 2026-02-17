import { LLMProvider } from '../llm/providers/base';
import { getIntentAnalysisPrompt } from '../llm/prompts/intent';
import { SearchResult } from '../search/types';
import { IntentAnalysis } from './types';
import { parseJsonFromLLM } from '../utils/json-parser';

/**
 * Analyze search intent from top ranking pages
 */
export async function analyzeIntent(
  keyword: string,
  topResults: SearchResult[],
  llmProvider: LLMProvider
): Promise<IntentAnalysis> {
  console.log(`[Intent] Analyzing search intent for: "${keyword}"`);

  const prompt = getIntentAnalysisPrompt(keyword, topResults);

  try {
    const response = await llmProvider.generate(prompt, {
      temperature: 0.3, // Lower temperature for more consistent classification
      maxTokens: 1000,
    });

    // Parse JSON response (handles markdown code blocks)
    const analysis = parseJsonFromLLM(response.content);

    // Validate required fields
    if (!analysis.intent || !analysis.userGoal || !analysis.buyerStage) {
      throw new Error('Invalid intent analysis response');
    }

    console.log(`[Intent] Classified as: ${analysis.intent} (${analysis.confidence}% confidence)`);

    return analysis as IntentAnalysis;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Intent analysis failed: ${error.message}`);
    }
    throw new Error('Intent analysis failed with unknown error');
  }
}

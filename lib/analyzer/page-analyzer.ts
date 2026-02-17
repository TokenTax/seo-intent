import { LLMProvider } from '../llm/providers/base';
import { getPageAnalysisPrompt } from '../llm/prompts/page';
import { PageData } from '../scraper/types';
import { PageAnalysis } from './types';
import { parseJsonFromLLM } from '../utils/json-parser';

/**
 * Analyze a single competitor page
 */
export async function analyzeCompetitorPage(
  keyword: string,
  pageData: PageData,
  position: number,
  llmProvider: LLMProvider
): Promise<PageAnalysis> {
  console.log(`[PageAnalyzer] Analyzing page #${position}: ${pageData.url}`);

  const prompt = getPageAnalysisPrompt(keyword, pageData, position);

  try {
    const response = await llmProvider.generate(prompt, {
      temperature: 0.5,
      maxTokens: 2000,
    });

    // Parse JSON response (handles markdown code blocks)
    const analysis = parseJsonFromLLM(response.content);

    // Validate required fields
    if (!analysis.strengths || !analysis.contentType) {
      throw new Error('Invalid page analysis response');
    }

    return {
      position,
      url: pageData.url,
      title: pageData.title,
      ...analysis,
      pageData,
    } as PageAnalysis;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Page analysis failed for ${pageData.url}: ${error.message}`);
    }
    throw new Error(`Page analysis failed for ${pageData.url}: Unknown error`);
  }
}

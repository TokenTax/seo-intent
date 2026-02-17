import { LLMProvider } from '../llm/providers/base';
import { PageData } from '../scraper/types';
import { PageAnalysis } from './types';
import { analyzeCompetitorPage } from './page-analyzer';

/**
 * Analyze all top 5 competitor pages sequentially
 */
export async function analyzeCompetitors(
  keyword: string,
  competitorPages: PageData[],
  llmProvider: LLMProvider
): Promise<PageAnalysis[]> {
  console.log(`[Competitor] Analyzing ${competitorPages.length} competitor pages`);

  const analyses: PageAnalysis[] = [];

  // Analyze sequentially to avoid rate limits
  for (let i = 0; i < competitorPages.length; i++) {
    try {
      const analysis = await analyzeCompetitorPage(
        keyword,
        competitorPages[i],
        i + 1,
        llmProvider
      );
      analyses.push(analysis);

      // Small delay between LLM calls
      if (i < competitorPages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`[Competitor] Failed to analyze page #${i + 1}:`, error);
      // Continue with other pages even if one fails
    }
  }

  console.log(`[Competitor] Successfully analyzed ${analyses.length}/${competitorPages.length} pages`);

  return analyses;
}

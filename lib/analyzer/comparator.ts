import { LLMProvider } from '../llm/providers/base';
import { getPatternDetectionPrompt } from '../llm/prompts/patterns';
import { getRecommendationsPrompt } from '../llm/prompts/recommendations';
import { PageData } from '../scraper/types';
import { PageAnalysis, PatternAnalysis, RecommendationAnalysis, IntentAnalysis } from './types';
import { parseJsonFromLLM } from '../utils/json-parser';

/**
 * Detect common patterns across top ranking pages
 */
export async function detectPatterns(
  keyword: string,
  competitorAnalyses: PageAnalysis[],
  llmProvider: LLMProvider
): Promise<PatternAnalysis> {
  console.log(`[Comparator] Detecting patterns across ${competitorAnalyses.length} pages`);

  const pageData = competitorAnalyses.map(analysis => ({
    position: analysis.position,
    analysis,
    data: analysis.pageData,
  }));

  const prompt = getPatternDetectionPrompt(keyword, pageData);

  try {
    const response = await llmProvider.generate(prompt, {
      temperature: 0.4,
      maxTokens: 2500,
    });

    const patterns = parseJsonFromLLM(response.content);

    // Validate required fields
    if (!patterns.commonPatterns || !patterns.contentLength) {
      throw new Error('Invalid pattern analysis response');
    }

    console.log(`[Comparator] Found ${patterns.commonPatterns.length} common patterns`);

    return patterns as PatternAnalysis;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Pattern detection failed: ${error.message}`);
    }
    throw new Error('Pattern detection failed with unknown error');
  }
}

/**
 * Generate recommendations by comparing target page against patterns
 */
export async function generateRecommendations(
  keyword: string,
  targetPage: PageData,
  patterns: PatternAnalysis,
  intentAnalysis: IntentAnalysis,
  llmProvider: LLMProvider
): Promise<RecommendationAnalysis> {
  console.log(`[Comparator] Generating recommendations for target page`);

  const prompt = getRecommendationsPrompt(keyword, targetPage, patterns, intentAnalysis);

  // First attempt with full prompt
  try {
    const response = await llmProvider.generate(prompt, {
      temperature: 0.5, // Lower temperature for more consistent JSON
      maxTokens: 4096,
    });

    console.log(`[Comparator] Received response (${response.content.length} chars)`);

    const recommendations = parseJsonFromLLM(response.content);

    // Validate required fields
    if (!recommendations.recommendations || !recommendations.criticalGaps) {
      console.error('[Comparator] Invalid response structure:', recommendations);
      throw new Error('Invalid recommendations response - missing required fields');
    }

    console.log(`[Comparator] Generated ${recommendations.recommendations.length} recommendations`);

    return recommendations as RecommendationAnalysis;
  } catch (error) {
    console.error('[Comparator] First attempt failed:', error);
    console.log('[Comparator] Retrying with simplified prompt...');

    // Retry with a simpler, more constrained prompt
    try {
      const simplePrompt = `Based on competitor analysis, provide 5 key SEO recommendations for "${keyword}".

CRITICAL: Return ONLY valid JSON. No trailing commas. No comments. Proper formatting.

{
  "criticalGaps": ["gap1", "gap2", "gap3"],
  "recommendations": [
    {
      "priority": "HIGH",
      "category": "content",
      "title": "Short title",
      "description": "Specific action to take",
      "reasoning": "Why this helps",
      "effort": "medium"
    }
  ],
  "quickWins": ["win1", "win2"],
  "contentStrategy": "Brief strategy",
  "technicalSEO": ["item1", "item2"]
}

Patterns found: ${JSON.stringify(patterns.mustHaveElements || []).substring(0, 500)}
Target gaps: Word count is ${targetPage.wordCount}, missing: ${!targetPage.hasFAQ ? 'FAQ' : ''} ${!targetPage.hasVideo ? 'video' : ''}`;

      const retryResponse = await llmProvider.generate(simplePrompt, {
        temperature: 0.3,
        maxTokens: 2048,
      });

      const recommendations = parseJsonFromLLM(retryResponse.content);

      // Validate required fields
      if (!recommendations.recommendations || !recommendations.criticalGaps) {
        // Return a minimal valid response rather than failing
        console.warn('[Comparator] Retry failed, returning minimal recommendations');
        return {
          criticalGaps: ['Unable to generate detailed analysis due to JSON parsing issues'],
          recommendations: [
            {
              priority: 'HIGH',
              category: 'content',
              title: 'Match competitor content patterns',
              description: `Based on analysis, top pages average ${patterns.contentLength?.average || 2000} words. Consider expanding content to match.`,
              reasoning: 'Content length correlates with rankings for this keyword',
              effort: 'high',
            },
          ],
          quickWins: ['Review competitor strategies manually'],
          contentStrategy: 'Analyze top-ranking pages for content structure and depth',
          technicalSEO: ['Ensure proper schema markup', 'Optimize page speed'],
        };
      }

      console.log(`[Comparator] Retry successful - generated ${recommendations.recommendations.length} recommendations`);
      return recommendations as RecommendationAnalysis;
    } catch (retryError) {
      console.error('[Comparator] Retry also failed:', retryError);
      // Return minimal but valid recommendations
      return {
        criticalGaps: ['Analysis encountered issues - manual review recommended'],
        recommendations: [
          {
            priority: 'HIGH',
            category: 'content',
            title: 'Analyze top-ranking competitors',
            description: 'Manually review the top 5 ranking pages to identify key content elements and structure.',
            reasoning: 'Automated analysis encountered technical issues',
            effort: 'medium',
          },
        ],
        quickWins: ['Review competitor page structures', 'Check schema markup implementation'],
        contentStrategy: 'Study successful competitor content patterns',
        technicalSEO: ['Ensure technical SEO basics are covered'],
      };
    }
  }
}

import { PageData } from '../../scraper/types';

/**
 * Generate prompt for creating actionable recommendations
 */
export function getRecommendationsPrompt(
  keyword: string,
  targetPage: PageData,
  competitorPatterns: any,
  intentAnalysis: any
): string {
  const wasScraped = targetPage.wordCount > 0;
  const scrapingNote = wasScraped ? '' : `
⚠️ NOTE: The target page could not be scraped (likely blocked by anti-bot protection).
Base recommendations on competitor patterns and best practices for this search intent.
`;

  return `Generate actionable SEO recommendations for a page targeting "${keyword}".

SEARCH INTENT:
${JSON.stringify(intentAnalysis, null, 2)}

TARGET PAGE CURRENT STATE:
- URL: ${targetPage.url}
- Title: ${targetPage.title}
- Meta Description: ${targetPage.metaDescription || 'Not available'}
- Word Count: ${targetPage.wordCount}
- H1: ${targetPage.h1Tags.join(', ') || 'Not available'}
- Has FAQ: ${targetPage.hasFAQ ? 'Yes' : 'No'}
- Has Video: ${targetPage.hasVideo ? 'Yes' : 'No'}
- Has Tables: ${targetPage.hasTables ? 'Yes' : 'No'}
- Schema Types: ${targetPage.schemaTypes.join(', ') || 'None'}
${scrapingNote}
COMPETITOR PATTERNS (from top 5 ranking pages):
${JSON.stringify(competitorPatterns, null, 2)}

Based on this analysis, provide specific, actionable recommendations to help this page rank #1.

IMPORTANT: Return ONLY valid JSON with no trailing commas. Do not include any text before or after the JSON.

Return your recommendations in this exact JSON format:
{
  "criticalGaps": [
    "List of the most important missing elements compared to top rankers"
  ],
  "recommendations": [
    {
      "priority": "HIGH|MEDIUM|LOW",
      "category": "content|technical|structure|other",
      "title": "Brief title of the recommendation",
      "description": "Detailed, actionable recommendation",
      "reasoning": "Why this will help rankings",
      "effort": "low|medium|high"
    }
  ],
  "quickWins": [
    "List 2-3 easy improvements that can be done quickly"
  ],
  "contentStrategy": "Overall content strategy recommendation",
  "technicalSEO": [
    "Technical SEO improvements needed"
  ]
}

Prioritize recommendations that address the biggest gaps.

CRITICAL: Ensure your JSON is valid:
- No trailing commas in arrays or objects
- All strings must use double quotes
- No comments
- Proper escaping of special characters

Return only the JSON object, nothing else.`;
}

import { SearchResult } from '../../search/types';

/**
 * Generate prompt for analyzing search intent
 */
export function getIntentAnalysisPrompt(keyword: string, topResults: SearchResult[]): string {
  const resultsText = topResults
    .map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   Snippet: ${r.snippet}`)
    .join('\n\n');

  return `Analyze the search intent for the keyword: "${keyword}"

Based on the top 5 Google search results below, determine:
1. The primary search intent (informational, transactional, navigational, or commercial investigation)
2. The specific user goal or question being answered
3. The buyer journey stage (awareness, consideration, decision)
4. Confidence level (0-100%)

Top 5 Results:
${resultsText}

IMPORTANT: Return ONLY valid JSON with no trailing commas.

Provide your analysis in the following JSON format:
{
  "intent": "informational|transactional|navigational|commercial",
  "userGoal": "Description of what the user is trying to accomplish",
  "buyerStage": "awareness|consideration|decision",
  "confidence": 85,
  "reasoning": "Brief explanation of your classification"
}

Return only valid JSON with no trailing commas, no additional text.`;
}

/**
 * Generate prompt for detecting common patterns across top ranking pages
 */
export function getPatternDetectionPrompt(
  keyword: string,
  pageAnalyses: Array<{ position: number; analysis: any; data: any }>
): string {
  const summaries = pageAnalyses
    .map(p => `#${p.position}: ${p.data.title}
  Content Type: ${p.analysis.contentType}
  Word Count: ${p.data.wordCount}
  Key Elements: ${p.analysis.keyElements.join(', ')}
  Strengths: ${p.analysis.strengths.join(', ')}`)
    .join('\n\n');

  return `Identify common patterns across these top 5 ranking pages for "${keyword}":

${summaries}

Find patterns that appear in 3 or more pages. These patterns are likely important for ranking.

IMPORTANT: Return ONLY valid JSON with no trailing commas.

Provide your analysis in JSON format:
{
  "commonPatterns": [
    {
      "pattern": "Description of the pattern",
      "frequency": "Number of pages (e.g., 4/5)",
      "importance": "high|medium|low",
      "examples": ["Brief examples from the pages"]
    }
  ],
  "contentLength": {
    "average": 0,
    "range": "X - Y words",
    "recommendation": "Recommended word count range"
  },
  "commonElements": ["List elements found in most pages (FAQ, tables, etc.)"],
  "contentStructure": "Description of how top pages structure their content",
  "mustHaveElements": ["Critical elements needed to compete"]
}

Return only valid JSON with no trailing commas, no additional text.`;
}

import { PageData } from '../../scraper/types';

/**
 * Generate prompt for analyzing a single competitor page
 */
export function getPageAnalysisPrompt(keyword: string, page: PageData, position: number): string {
  return `Analyze this page that ranks #${position} for "${keyword}":

URL: ${page.url}
Title: ${page.title}
Meta Description: ${page.metaDescription}

Heading Structure:
H1: ${page.h1Tags.join(', ') || 'None'}
H2 Tags (${page.h2Tags.length}): ${page.h2Tags.slice(0, 10).join(', ')}${page.h2Tags.length > 10 ? '...' : ''}
H3 Tags (${page.h3Tags.length}): ${page.h3Tags.slice(0, 5).join(', ')}${page.h3Tags.length > 5 ? '...' : ''}

Content Stats:
- Word Count: ${page.wordCount}
- Images: ${page.imageCount}
- Has Video: ${page.hasVideo ? 'Yes' : 'No'}
- Has FAQ: ${page.hasFAQ ? 'Yes' : 'No'}
- Has Tables: ${page.hasTables ? 'Yes' : 'No'}
- Has Lists: ${page.hasLists ? 'Yes' : 'No'}
- Schema Types: ${page.schemaTypes.join(', ') || 'None'}
- Internal Links: ${page.internalLinks}
- External Links: ${page.externalLinks}

Content Preview (first 1000 chars):
${page.contentText.substring(0, 1000)}...

IMPORTANT: Return ONLY valid JSON with no trailing commas.

Analyze this page and provide insights in JSON format:
{
  "strengths": ["List 3-5 key strengths that help this page rank well"],
  "contentType": "tutorial|guide|comparison|product-page|listicle|tool|other",
  "keyElements": ["List notable content elements like calculators, comparisons, etc."],
  "targetAudience": "Description of who this content is for",
  "contentDepth": "shallow|moderate|comprehensive",
  "notes": "Any other relevant observations"
}

Return only valid JSON with no trailing commas, no additional text.`;
}

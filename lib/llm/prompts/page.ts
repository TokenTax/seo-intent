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
  "strengths": [
    {
      "description": "Clear description of what this element does well for SEO",
      "selector": "CSS selector(s) to find this element, comma-separated for multiple options",
      "selectorFallback": "Generic fallback selector if primary not found"
    }
  ],
  "contentType": "tutorial|guide|comparison|product-page|listicle|tool|other",
  "keyElements": ["List notable content elements like calculators, comparisons, etc."],
  "targetAudience": "Description of who this content is for",
  "contentDepth": "shallow|moderate|comprehensive",
  "notes": "Any other relevant observations"
}

For strengths, identify 3-5 key elements that help this page rank well. Provide CSS selectors that would capture that element visually.

IMPORTANT: Only include VISUALLY INTERESTING elements that would benefit from a screenshot:
- Good: FAQ sections, comparison tables, hero banners, pricing tables, infographics, product galleries, feature showcases
- Skip: Code blocks, technical documentation, plain text paragraphs, navigation menus, footers, sidebars

Use common selector patterns:
- FAQ sections: "#faq, .faq, .faqs, [itemtype*='FAQPage'], .faq-section"
- Comparison tables: "table.comparison, .comparison-table, .vs-table, table:not(nav table)"
- Hero sections: "#hero, .hero, .hero-section, .hero-banner"
- Pricing tables: "#pricing, .pricing, .pricing-table, .plans"
- Feature lists: ".features, .feature-list, #features, .feature-grid"
- Video embeds: ".video-container, .video-wrapper"
- CTA sections: ".cta, .call-to-action, #cta"
- Product galleries: ".product-gallery, .gallery, .carousel"
- Infographics: ".infographic, .chart, .graph"

Do NOT suggest selectors for: pre, code, .code, script, nav, footer, sidebar, .sidebar

Return only valid JSON with no trailing commas, no additional text.`;
}

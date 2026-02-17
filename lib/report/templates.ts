import { AnalysisReport } from '../analyzer/types';

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate overview section
 */
export function generateOverviewSection(report: AnalysisReport): string {
  // Check for scraping issues
  const targetScraped = report.targetPageData.wordCount > 0;
  const totalCompetitors = 5; // Top 5
  const scrapedCompetitors = report.competitorAnalyses.length;

  let scrapingNotes = '';
  if (!targetScraped || scrapedCompetitors < totalCompetitors) {
    scrapingNotes = '\n\n> **Scraping Notes:**\n';
    if (!targetScraped) {
      scrapingNotes += `> - ⚠️ Target page could not be scraped (403/404). Recommendations based on competitor patterns.\n`;
    }
    if (scrapedCompetitors < totalCompetitors) {
      scrapingNotes += `> - ⚠️ Only ${scrapedCompetitors} of ${totalCompetitors} competitor pages could be scraped. Some sites block automated access.\n`;
    }
  }

  return `# SEO Intent Analysis: ${report.keyword}

## Analysis Overview

- **Keyword:** ${report.keyword}
- **Target URL:** ${report.targetUrl}
- **Analysis Date:** ${formatDate(report.analyzedAt)}
- **Model:** ${report.model}
- **Competitors Analyzed:** ${scrapedCompetitors}/${totalCompetitors} successfully scraped
${scrapingNotes}
`;
}

/**
 * Generate search intent section
 */
export function generateIntentSection(report: AnalysisReport): string {
  const intent = report.intentAnalysis;

  return `## Search Intent Analysis

- **Primary Intent:** ${intent.intent.charAt(0).toUpperCase() + intent.intent.slice(1)} (${intent.confidence}% confidence)
- **User Goal:** ${intent.userGoal}
- **Buyer Journey Stage:** ${intent.buyerStage.charAt(0).toUpperCase() + intent.buyerStage.slice(1)}

**Reasoning:** ${intent.reasoning}
`;
}

/**
 * Generate top 5 rankings section
 */
export function generateTopPagesSection(report: AnalysisReport): string {
  let section = `## Top 5 Ranking Pages\n\n`;

  for (const analysis of report.competitorAnalyses) {
    section += `### #${analysis.position}: ${analysis.title}\n\n`;
    section += `- **URL:** ${analysis.url}\n`;
    section += `- **Content Type:** ${analysis.contentType}\n`;
    section += `- **Content Depth:** ${analysis.contentDepth}\n`;
    section += `- **Word Count:** ${analysis.pageData.wordCount}\n`;
    section += `- **Target Audience:** ${analysis.targetAudience}\n\n`;

    section += `**Strengths:**\n`;
    analysis.strengths.forEach(strength => {
      section += `- ${strength}\n`;
    });

    section += `\n**Key Elements:**\n`;
    analysis.keyElements.forEach(element => {
      section += `- ${element}\n`;
    });

    if (analysis.notes) {
      section += `\n**Notes:** ${analysis.notes}\n`;
    }

    section += `\n`;
  }

  return section;
}

/**
 * Generate common patterns section
 */
export function generatePatternsSection(report: AnalysisReport): string {
  const patterns = report.patternAnalysis;

  let section = `## Common Patterns Across Top Rankers\n\n`;

  section += `### Content Length\n\n`;
  section += `- **Average:** ${patterns.contentLength.average} words\n`;
  section += `- **Range:** ${patterns.contentLength.range}\n`;
  section += `- **Recommendation:** ${patterns.contentLength.recommendation}\n\n`;

  section += `### Patterns Found (3+ pages)\n\n`;
  patterns.commonPatterns.forEach(pattern => {
    const importance = pattern.importance.toUpperCase();
    section += `#### [${importance}] ${pattern.pattern}\n\n`;
    section += `- **Frequency:** ${pattern.frequency}\n`;
    section += `- **Examples:**\n`;
    pattern.examples.forEach(example => {
      section += `  - ${example}\n`;
    });
    section += `\n`;
  });

  section += `### Must-Have Elements\n\n`;
  patterns.mustHaveElements.forEach(element => {
    section += `- ${element}\n`;
  });

  section += `\n### Content Structure\n\n`;
  section += `${patterns.contentStructure}\n\n`;

  section += `### Common Elements\n\n`;
  patterns.commonElements.forEach(element => {
    section += `- ${element}\n`;
  });

  return section + `\n`;
}

/**
 * Generate your page analysis section
 */
export function generateYourPageSection(report: AnalysisReport): string {
  const page = report.targetPageData;

  let section = `## Your Page Analysis\n\n`;

  // Check if page was successfully scraped
  const wasScraped = page.wordCount > 0;
  if (!wasScraped) {
    section += `> ⚠️ **Warning:** Your target page could not be scraped (403 Forbidden or 404 Not Found). This usually means the site has anti-bot protection. The analysis below is based only on competitor patterns. Consider:\n`;
    section += `> - Using a different URL that's publicly accessible\n`;
    section += `> - Checking if the URL is correct and publicly available\n`;
    section += `> - The recommendations are still valid based on competitor analysis\n\n`;
  }

  section += `### Current State\n\n`;
  section += `- **Title:** ${page.title}\n`;
  section += `- **Meta Description:** ${page.metaDescription || 'Missing'}\n`;
  section += `- **Word Count:** ${page.wordCount}\n`;
  section += `- **H1 Tags:** ${page.h1Tags.join(', ') || 'None'}\n`;
  section += `- **Images:** ${page.imageCount}\n`;
  section += `- **Has Video:** ${page.hasVideo ? 'Yes' : 'No'}\n`;
  section += `- **Has FAQ:** ${page.hasFAQ ? 'Yes' : 'No'}\n`;
  section += `- **Has Tables:** ${page.hasTables ? 'Yes' : 'No'}\n`;
  section += `- **Schema Types:** ${page.schemaTypes.join(', ') || 'None'}\n\n`;

  section += `### Critical Gaps\n\n`;
  report.recommendations.criticalGaps.forEach(gap => {
    section += `- ${gap}\n`;
  });

  return section + `\n`;
}

/**
 * Generate recommendations section
 */
export function generateRecommendationsSection(report: AnalysisReport): string {
  const recs = report.recommendations;

  let section = `## Recommendations (Priority Order)\n\n`;

  // Group by priority
  const high = recs.recommendations.filter(r => r.priority === 'HIGH');
  const medium = recs.recommendations.filter(r => r.priority === 'MEDIUM');
  const low = recs.recommendations.filter(r => r.priority === 'LOW');

  let counter = 1;

  // High priority
  if (high.length > 0) {
    high.forEach(rec => {
      section += `### ${counter}. [${rec.priority}] ${rec.title}\n\n`;
      section += `**Category:** ${rec.category} | **Effort:** ${rec.effort}\n\n`;
      section += `${rec.description}\n\n`;
      section += `**Why this matters:** ${rec.reasoning}\n\n`;
      counter++;
    });
  }

  // Medium priority
  if (medium.length > 0) {
    medium.forEach(rec => {
      section += `### ${counter}. [${rec.priority}] ${rec.title}\n\n`;
      section += `**Category:** ${rec.category} | **Effort:** ${rec.effort}\n\n`;
      section += `${rec.description}\n\n`;
      section += `**Why this matters:** ${rec.reasoning}\n\n`;
      counter++;
    });
  }

  // Low priority
  if (low.length > 0) {
    low.forEach(rec => {
      section += `### ${counter}. [${rec.priority}] ${rec.title}\n\n`;
      section += `**Category:** ${rec.category} | **Effort:** ${rec.effort}\n\n`;
      section += `${rec.description}\n\n`;
      section += `**Why this matters:** ${rec.reasoning}\n\n`;
      counter++;
    });
  }

  section += `## Quick Wins\n\n`;
  section += `These are easy improvements that can be implemented quickly:\n\n`;
  recs.quickWins.forEach(win => {
    section += `- ${win}\n`;
  });

  section += `\n## Content Strategy\n\n`;
  section += `${recs.contentStrategy}\n\n`;

  section += `## Technical SEO\n\n`;
  recs.technicalSEO.forEach(item => {
    section += `- ${item}\n`;
  });

  return section + `\n`;
}

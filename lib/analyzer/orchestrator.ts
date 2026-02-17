import { LLMProvider } from '../llm/providers/base';
import { searchKeyword } from '../search/serpapi';
import { extractPageData, extractMultiplePages } from '../scraper/extractor';
import { analyzeIntent } from './intent';
import { analyzeCompetitors } from './competitor';
import { detectPatterns, generateRecommendations } from './comparator';
import { detectAIContent } from './ai-detector';
import { AnalysisReport } from './types';

/**
 * Main orchestrator that runs the complete 6-stage analysis pipeline
 */
export async function runAnalysis(
  keyword: string,
  targetUrl: string,
  llmProvider: LLMProvider,
  onProgress?: (stage: string, progress: number) => void
): Promise<AnalysisReport> {
  console.log(`\n========================================`);
  console.log(`Starting SEO Intent Analysis`);
  console.log(`Keyword: "${keyword}"`);
  console.log(`Target: ${targetUrl}`);
  console.log(`Model: ${llmProvider.getModel()}`);
  console.log(`========================================\n`);

  try {
    // Stage 1: Search & Scrape
    onProgress?.('Searching Google and scraping top 5 pages', 10);
    console.log('[Stage 1/5] Searching and scraping...');

    const searchResults = await searchKeyword(keyword);
    console.log(`Found ${searchResults.length} search results`);

    const competitorUrls = searchResults.map(r => r.url);
    const rateLimit = parseInt(process.env.RATE_LIMIT_DELAY_MS || '1000', 10);

    const competitorPages = await extractMultiplePages(competitorUrls, rateLimit);
    console.log(`Successfully scraped ${competitorPages.length}/${competitorUrls.length} competitor pages`);

    // Ensure we have at least 2 competitor pages to analyze
    if (competitorPages.length < 2) {
      throw new Error(`Only scraped ${competitorPages.length} competitor pages. Need at least 2 for analysis. Some sites may be blocking the scraper.`);
    }

    // Try to scrape target page, but allow analysis to continue if it fails
    let targetPageData;
    try {
      targetPageData = await extractPageData(targetUrl);
      console.log(`Scraped target page: ${targetUrl}`);
    } catch (error) {
      console.error(`[Orchestrator] Failed to scrape target page: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log(`[Orchestrator] Creating placeholder data for target page to continue analysis`);

      // Create placeholder data so analysis can continue
      targetPageData = {
        url: targetUrl,
        title: 'Unable to scrape (403/404 or blocked)',
        metaDescription: '',
        h1Tags: [],
        h2Tags: [],
        h3Tags: [],
        contentText: 'Page could not be scraped - site may have anti-bot protection.',
        wordCount: 0,
        hasSchema: false,
        schemaTypes: [],
        imageCount: 0,
        hasVideo: false,
        hasFAQ: false,
        hasTables: false,
        hasLists: false,
        internalLinks: 0,
        externalLinks: 0,
        fetchedAt: new Date(),
      };
    }

    // Stage 2: Intent Analysis
    onProgress?.('Analyzing search intent', 30);
    console.log('\n[Stage 2/5] Analyzing search intent...');

    const intentAnalysis = await analyzeIntent(keyword, searchResults, llmProvider);

    // Stage 3: Competitor Analysis
    onProgress?.('Analyzing top 5 competitor pages', 50);
    console.log('\n[Stage 3/5] Analyzing competitors...');

    const competitorAnalyses = await analyzeCompetitors(keyword, competitorPages, llmProvider);

    // Stage 4: Pattern Detection
    onProgress?.('Detecting common patterns', 60);
    console.log('\n[Stage 4/6] Detecting patterns...');

    const patternAnalysis = await detectPatterns(keyword, competitorAnalyses, llmProvider);

    // Stage 5: AI Content Detection
    onProgress?.('Analyzing content for AI generation', 75);
    console.log('\n[Stage 5/6] Detecting AI-generated content...');

    const aiContentAnalysis = await detectAIContent(keyword, targetPageData, llmProvider);

    // Stage 6: Gap Analysis & Recommendations
    onProgress?.('Generating recommendations', 90);
    console.log('\n[Stage 6/6] Generating recommendations...');

    const recommendations = await generateRecommendations(
      keyword,
      targetPageData,
      patternAnalysis,
      intentAnalysis,
      llmProvider
    );

    onProgress?.('Analysis complete', 100);
    console.log('\n========================================');
    console.log('Analysis Complete!');
    console.log(`========================================\n`);

    return {
      keyword,
      targetUrl,
      analyzedAt: new Date(),
      model: llmProvider.getModel(),
      intentAnalysis,
      searchResults,
      competitorAnalyses,
      patternAnalysis,
      targetPageData,
      aiContentAnalysis,
      recommendations,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Analysis pipeline failed: ${error.message}`);
    }
    throw new Error('Analysis pipeline failed with unknown error');
  }
}

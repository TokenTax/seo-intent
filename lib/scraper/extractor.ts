import { fetcher } from './fetcher';
import { cleanText, countWords } from './parser';
import { PageData } from './types';
import { cache } from '../cache/cache-factory';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

/**
 * Generate a cache key for scraped page data
 */
function getPageCacheKey(url: string): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const urlHash = crypto.createHash('md5').update(url).digest('hex');
  return `page:${urlHash}:${today}`;
}

/**
 * Extract all SEO-relevant data from a URL with caching
 */
export async function extractPageData(url: string, useCache: boolean = true): Promise<PageData> {
  // Check cache first
  const cacheEnabled = useCache && process.env.ENABLE_SCRAPE_CACHE !== 'false';
  const cacheKey = getPageCacheKey(url);

  if (cacheEnabled) {
    const cached = await cache.get<PageData>(cacheKey);
    if (cached) {
      console.log(`[Extractor] Cache hit for ${url}`);
      // Update fetchedAt to current time but keep original data
      return { ...cached, fetchedAt: new Date() };
    }
  }

  console.log(`[Extractor] Extracting data from ${url}`);

  try {
    // Fetch HTML
    const html = await fetcher.fetchHTML(url);

    // Parse with Cheerio but DON'T remove scripts yet (we need them for schema extraction)
    const $ = cheerio.load(html);

    // Check for schema markup FIRST (before scripts are removed)
    const schemaScripts = $('script[type="application/ld+json"]');
    const hasSchema = schemaScripts.length > 0;
    const schemaTypes: string[] = [];

    if (hasSchema) {
      schemaScripts.each((_, el) => {
        try {
          const schemaData = JSON.parse($(el).html() || '{}');
          const type = schemaData['@type'] || (Array.isArray(schemaData['@graph'])
            ? schemaData['@graph'].map((item: any) => item['@type']).filter(Boolean)
            : []);

          if (Array.isArray(type)) {
            schemaTypes.push(...type);
          } else if (type) {
            schemaTypes.push(type);
          }
        } catch {
          // Invalid JSON, skip
        }
      });
    }

    // Extract title
    const title = $('title').first().text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  $('h1').first().text().trim() ||
                  'No title found';

    // Extract meta description
    const metaDescription = $('meta[name="description"]').attr('content') ||
                           $('meta[property="og:description"]').attr('content') ||
                           '';

    // Extract heading tags
    const h1Tags = $('h1').map((_, el) => cleanText($(el).text())).get().filter(Boolean);
    const h2Tags = $('h2').map((_, el) => cleanText($(el).text())).get().filter(Boolean);
    const h3Tags = $('h3').map((_, el) => cleanText($(el).text())).get().filter(Boolean);

    // Now remove scripts for clean text extraction
    $('script, style, noscript, iframe').remove();

    // Extract main content text
    const contentText = cleanText($('body').text());
    const wordCount = countWords(contentText);

    // Count images
    const imageCount = $('img').length;

    // Check for video
    const hasVideo = $('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="wistia"]').length > 0;

    // Check for FAQ
    const hasFAQ = $('.faq, [itemtype*="FAQPage"], [class*="faq"]').length > 0 ||
                   schemaTypes.some(type => type.toLowerCase().includes('faq'));

    // Check for tables
    const hasTables = $('table').length > 0;

    // Check for lists
    const hasLists = $('ul, ol').length > 0;

    // Count links
    const allLinks = $('a[href]');
    let internalLinks = 0;
    let externalLinks = 0;

    allLinks.each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.startsWith('http')) {
        try {
          const linkUrl = new URL(href);
          const pageUrl = new URL(url);
          if (linkUrl.hostname === pageUrl.hostname) {
            internalLinks++;
          } else {
            externalLinks++;
          }
        } catch {
          // Invalid URL
        }
      } else if (href.startsWith('/') || !href.startsWith('#')) {
        internalLinks++;
      }
    });

    const pageData: PageData = {
      url,
      title: cleanText(title),
      metaDescription: cleanText(metaDescription),
      h1Tags,
      h2Tags,
      h3Tags,
      contentText: contentText.substring(0, 10000), // Limit to first 10k chars to save tokens
      wordCount,
      hasSchema,
      schemaTypes: [...new Set(schemaTypes)],
      imageCount,
      hasVideo,
      hasFAQ,
      hasTables,
      hasLists,
      internalLinks,
      externalLinks,
      fetchedAt: new Date(),
    };

    console.log(`[Extractor] Successfully extracted data from ${url} (${wordCount} words)`);

    // Cache the result
    if (cacheEnabled) {
      const ttlHours = parseInt(process.env.SCRAPE_CACHE_TTL_HOURS || '24', 10);
      await cache.set(cacheKey, pageData, ttlHours);
      console.log(`[Extractor] Cached page data for ${url} (TTL: ${ttlHours}h)`);
    }

    return pageData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract data from ${url}: ${error.message}`);
    }
    throw new Error(`Failed to extract data from ${url}: Unknown error`);
  }
}

/**
 * Extract data from multiple URLs with rate limiting
 */
export async function extractMultiplePages(
  urls: string[],
  delayMs: number = 1000
): Promise<PageData[]> {
  const results: PageData[] = [];

  for (let i = 0; i < urls.length; i++) {
    try {
      const data = await extractPageData(urls[i]);
      results.push(data);

      // Add delay between requests (except after last request)
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`[Extractor] Failed to extract ${urls[i]}:`, error);
      // Continue with other URLs even if one fails
    }
  }

  return results;
}

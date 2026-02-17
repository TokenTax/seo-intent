import * as cheerio from 'cheerio';

export interface ParsedHTML {
  $: cheerio.CheerioAPI;
  text: string;
}

/**
 * Parse HTML string into Cheerio object
 */
export function parseHTML(html: string): ParsedHTML {
  const $ = cheerio.load(html);

  // Remove script and style tags for clean text extraction
  $('script, style, noscript, iframe').remove();

  const text = $('body').text();

  return { $, text };
}

/**
 * Extract text content from HTML, removing extra whitespace
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  const cleaned = cleanText(text);
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(word => word.length > 0).length;
}

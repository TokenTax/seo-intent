import { getJson } from 'serpapi';
import { cache } from '../cache/cache-factory';
import { SearchResult, SearchOptions, SerpApiResponse } from './types';

/**
 * Generate a cache key for SerpAPI searches
 */
function getCacheKey(keyword: string, options: SearchOptions): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const location = options.location || 'United States';
  const gl = options.gl || 'us';
  const hl = options.hl || 'en';

  return `serp:${keyword}:${location}:${gl}:${hl}:${today}`;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Search for a keyword using SerpAPI and return top 5 organic results
 * Results are cached for 24 hours to save API credits
 */
export async function searchKeyword(
  keyword: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  if (!keyword || keyword.trim().length === 0) {
    throw new Error('Keyword is required');
  }

  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error('SERPAPI_API_KEY environment variable is not set');
  }

  console.log(`[SerpAPI] API key present: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);

  // Check cache first
  const cacheEnabled = process.env.ENABLE_SERP_CACHE !== 'false';
  const cacheKey = getCacheKey(keyword, options);

  if (cacheEnabled) {
    const cached = await cache.get<SearchResult[]>(cacheKey);
    if (cached) {
      console.log(`[SerpAPI] Cache hit for keyword: "${keyword}"`);
      return cached;
    }
  }

  console.log(`[SerpAPI] Fetching results for keyword: "${keyword}"`);
  console.log(`[SerpAPI] Using location: ${options.location || 'United States'}, gl: ${options.gl || 'us'}`);

  try {
    // Call SerpAPI using callback style for better error handling
    const response: any = await new Promise((resolve, reject) => {
      getJson(
        {
          api_key: apiKey,
          engine: 'google',
          q: keyword,
          location: options.location || 'United States',
          gl: options.gl || 'us',
          hl: options.hl || 'en',
          num: options.num || 10,
        },
        (data: any) => {
          // Check if the response contains an error
          if (data && data.error) {
            console.error('[SerpAPI] API returned error:', data.error);
            reject(new Error(`SerpAPI Error: ${data.error}`));
            return;
          }

          // Check for search metadata errors
          if (data && data.search_metadata && data.search_metadata.status === 'error') {
            console.error('[SerpAPI] Search metadata error:', data.search_metadata);
            reject(new Error('SerpAPI returned an error status. Check your API key and quota.'));
            return;
          }

          console.log('[SerpAPI] Received response:', {
            hasOrganicResults: !!data?.organic_results,
            organicResultsCount: data?.organic_results?.length || 0,
            searchMetadata: data?.search_metadata,
          });

          resolve(data);
        }
      );
    });

    // Extract organic results
    const organicResults = response.organic_results || [];

    if (organicResults.length === 0) {
      console.warn('[SerpAPI] No organic results found. Full response:', JSON.stringify(response, null, 2));
      throw new Error(`No organic results found for keyword: "${keyword}". This might be a restricted or unavailable search.`);
    }

    // Map to our SearchResult format and take top 5
    const results: SearchResult[] = organicResults
      .slice(0, 5)
      .map((result: any) => ({
        position: result.position,
        title: result.title,
        url: result.link,
        snippet: result.snippet || '',
        domain: extractDomain(result.link),
      }));

    // Cache the results
    if (cacheEnabled) {
      const ttlHours = parseInt(process.env.SERP_CACHE_TTL_HOURS || '24', 10);
      await cache.set(cacheKey, results, ttlHours);
      console.log(`[SerpAPI] Cached results for keyword: "${keyword}" (TTL: ${ttlHours}h)`);
    }

    return results;
  } catch (error) {
    // Log the full error for debugging
    console.error('[SerpAPI] Full error:', error);

    if (error instanceof Error) {
      throw new Error(`SerpAPI search failed: ${error.message}`);
    }

    // Try to extract any useful info from the error object
    const errorStr = JSON.stringify(error, null, 2);
    console.error('[SerpAPI] Error details:', errorStr);
    throw new Error(`SerpAPI search failed: ${errorStr}`);
  }
}

/**
 * Clear cached search results for a specific keyword
 */
export async function clearSearchCache(keyword: string, options: SearchOptions = {}): Promise<void> {
  const cacheKey = getCacheKey(keyword, options);
  await cache.delete(cacheKey);
  console.log(`[SerpAPI] Cleared cache for keyword: "${keyword}"`);
}

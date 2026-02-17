import axios, { AxiosInstance, AxiosError } from 'axios';
import { ScraperOptions } from './types';

// Dynamically import ScrapingBee only if needed
let ScrapingBeeClientClass: any = null;
const loadScrapingBee = async () => {
  if (!ScrapingBeeClientClass) {
    const module = await import('scrapingbee');
    // ScrapingBee exports ScrapingBeeClient as a named export
    ScrapingBeeClientClass = module.ScrapingBeeClient;
  }
  return ScrapingBeeClientClass;
};

/**
 * HTTP client with retry logic and ScrapingBee support
 */
export class Fetcher {
  private client: AxiosInstance;
  private maxRetries: number;
  private useScrapingBee: boolean;
  private scrapingBeeApiKey?: string;

  constructor(options: ScraperOptions = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.useScrapingBee = process.env.USE_SCRAPINGBEE === 'true';
    this.scrapingBeeApiKey = process.env.SCRAPINGBEE_API_KEY;

    this.client = axios.create({
      timeout: options.timeout || 30000,
      headers: {
        'User-Agent': options.userAgent ||
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    if (this.useScrapingBee) {
      console.log('[Fetcher] ScrapingBee enabled');
    }
  }

  /**
   * Fetch HTML using ScrapingBee (bypasses anti-bot protection)
   */
  private async fetchWithScrapingBee(url: string): Promise<string> {
    if (!this.scrapingBeeApiKey) {
      throw new Error('ScrapingBee API key not set');
    }

    console.log(`[Fetcher] Using ScrapingBee for ${url}`);

    try {
      const ScrapingBeeClient = await loadScrapingBee();
      const client = new ScrapingBeeClient(this.scrapingBeeApiKey);

      const response = await client.get({
        url: url,
        params: {
          render_js: false, // Set to true if you need JavaScript rendering
          premium_proxy: false, // Set to true for residential proxies (more expensive)
          country_code: 'us',
        },
      });

      if (!response.data) {
        throw new Error('ScrapingBee returned empty response');
      }

      // ScrapingBee returns ArrayBuffer, convert to string
      const html = response.data.toString('utf8');
      console.log(`[Fetcher] ScrapingBee success (${html.length} bytes)`);
      return html;
    } catch (error) {
      console.error('[Fetcher] ScrapingBee error:', error);
      throw error;
    }
  }

  /**
   * Fetch HTML directly with exponential backoff retry
   */
  private async fetchDirectly(url: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[Fetcher] Direct fetch ${url} (attempt ${attempt}/${this.maxRetries})`);

        const response = await this.client.get(url);

        if (typeof response.data !== 'string') {
          throw new Error('Response is not HTML');
        }

        console.log(`[Fetcher] Direct fetch success (${response.data.length} bytes)`);
        return response.data;
      } catch (error) {
        lastError = error as Error;

        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;

          // Don't retry on 4xx errors (except 429)
          if (axiosError.response?.status &&
              axiosError.response.status >= 400 &&
              axiosError.response.status < 500 &&
              axiosError.response.status !== 429) {
            throw new Error(`HTTP ${axiosError.response.status}: ${axiosError.message}`);
          }
        }

        // Exponential backoff before retry
        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`[Fetcher] Retry ${attempt} failed, waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed to fetch ${url} after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Fetch HTML from a URL - tries ScrapingBee first if enabled, falls back to direct
   */
  async fetchHTML(url: string): Promise<string> {
    // Try ScrapingBee first if enabled
    if (this.useScrapingBee && this.scrapingBeeApiKey) {
      try {
        return await this.fetchWithScrapingBee(url);
      } catch (error) {
        console.warn('[Fetcher] ScrapingBee failed, falling back to direct fetch');
        // Fall through to direct fetch
      }
    }

    // Direct fetch (with retries)
    return await this.fetchDirectly(url);
  }
}

// Export singleton instance
export const fetcher = new Fetcher();

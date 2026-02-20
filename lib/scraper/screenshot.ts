import { compressAndEncode } from './image-utils';

// Dynamically import ScrapingBee only if needed
let ScrapingBeeClientClass: any = null;
const loadScrapingBee = async () => {
  if (!ScrapingBeeClientClass) {
    const module = await import('scrapingbee');
    ScrapingBeeClientClass = module.ScrapingBeeClient;
  }
  return ScrapingBeeClientClass;
};

export interface SectionScreenshot {
  selector: string;
  strength: string;
  base64: string;
  error?: string;
}

export interface ScreenshotSection {
  selector: string;
  selectorFallback?: string;
  strength: string;
}

// Sites where screenshots aren't valuable (UGC, forums, etc.)
const SKIP_SCREENSHOT_DOMAINS = [
  'reddit.com',
  'quora.com',
  'stackoverflow.com',
  'stackexchange.com',
  'github.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'linkedin.com',
  'medium.com', // Often paywalled
  'youtube.com',
  'wikipedia.org',
];

// Selectors that indicate non-visual/code content - skip these
const SKIP_SELECTORS = [
  'pre',
  'code',
  '.code',
  '.highlight',
  '.syntax',
  '.prism',
  '.hljs',
  'script',
  'style',
  'noscript',
];

/**
 * Check if a URL should skip screenshots
 */
export function shouldSkipScreenshot(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return SKIP_SCREENSHOT_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

/**
 * Check if a selector targets non-visual content
 */
export function isNonVisualSelector(selector: string): boolean {
  const lowerSelector = selector.toLowerCase();
  return SKIP_SELECTORS.some(skip =>
    lowerSelector.includes(skip)
  );
}

/**
 * Capture a screenshot of a specific element using ScrapingBee's screenshot_selector
 */
export async function captureElementScreenshot(
  url: string,
  selector: string
): Promise<Buffer | null> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;

  if (!apiKey) {
    console.warn('[Screenshot] ScrapingBee API key not set');
    return null;
  }

  console.log(`[Screenshot] Capturing ${selector} from ${url}`);

  try {
    const ScrapingBeeClient = await loadScrapingBee();
    const client = new ScrapingBeeClient(apiKey);

    const response = await client.get({
      url,
      params: {
        screenshot_selector: selector,
        render_js: true,
        window_width: 1280,
        wait: 2000, // Wait 2s for dynamic content
      },
    });

    if (!response.data || response.data.length === 0) {
      console.warn(`[Screenshot] Empty response for selector ${selector}`);
      return null;
    }

    // ScrapingBee returns ArrayBuffer for screenshots
    const buffer = Buffer.from(response.data);
    console.log(`[Screenshot] Success - captured ${buffer.length} bytes for ${selector}`);
    return buffer;
  } catch (error) {
    console.error(`[Screenshot] Failed to capture ${selector}:`, error);
    return null;
  }
}

/**
 * Capture a single section screenshot with fallback support
 */
async function captureSectionScreenshot(
  url: string,
  section: ScreenshotSection
): Promise<SectionScreenshot> {
  // Skip non-visual selectors (code, scripts, etc.)
  if (isNonVisualSelector(section.selector)) {
    console.log(`[Screenshot] Skipping non-visual selector: ${section.selector}`);
    return {
      selector: section.selector,
      strength: section.strength,
      base64: '',
      error: 'Non-visual content skipped',
    };
  }

  let buffer: Buffer | null = null;
  let usedSelector = section.selector;

  // Try primary selector first
  buffer = await captureElementScreenshot(url, section.selector);

  // If primary fails and we have a fallback, try that
  if (!buffer && section.selectorFallback) {
    // Skip if fallback is also non-visual
    if (!isNonVisualSelector(section.selectorFallback)) {
      console.log(`[Screenshot] Trying fallback selector: ${section.selectorFallback}`);
      buffer = await captureElementScreenshot(url, section.selectorFallback);
      usedSelector = section.selectorFallback;
    }
  }

  if (buffer) {
    try {
      const base64 = await compressAndEncode(buffer);
      return {
        selector: usedSelector,
        strength: section.strength,
        base64,
      };
    } catch (error) {
      return {
        selector: usedSelector,
        strength: section.strength,
        base64: '',
        error: `Compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  return {
    selector: section.selector,
    strength: section.strength,
    base64: '',
    error: 'Element not found or screenshot failed',
  };
}

/**
 * Capture screenshots for multiple page sections in parallel
 */
export async function capturePageSections(
  url: string,
  sections: ScreenshotSection[]
): Promise<SectionScreenshot[]> {
  // Skip screenshots for certain domains
  if (shouldSkipScreenshot(url)) {
    console.log(`[Screenshot] Skipping screenshots for ${url} (domain in skip list)`);
    return sections.map(section => ({
      selector: section.selector,
      strength: section.strength,
      base64: '',
      error: 'Screenshots disabled for this domain',
    }));
  }

  // Capture all sections in parallel
  console.log(`[Screenshot] Capturing ${sections.length} sections in parallel for ${url}`);
  const results = await Promise.all(
    sections.map(section => captureSectionScreenshot(url, section))
  );

  return results;
}

/**
 * Check if screenshot capture is enabled
 */
export function isScreenshotEnabled(): boolean {
  return (
    process.env.USE_SCRAPINGBEE === 'true' &&
    process.env.ENABLE_SCREENSHOTS === 'true' &&
    !!process.env.SCRAPINGBEE_API_KEY
  );
}

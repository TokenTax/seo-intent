export interface PageData {
  url: string;
  title: string;
  metaDescription: string;
  h1Tags: string[];
  h2Tags: string[];
  h3Tags: string[];
  contentText: string;
  wordCount: number;
  hasSchema: boolean;
  schemaTypes: string[];
  imageCount: number;
  hasVideo: boolean;
  hasFAQ: boolean;
  hasTables: boolean;
  hasLists: boolean;
  internalLinks: number;
  externalLinks: number;
  fetchedAt: Date;
}

export interface ScraperOptions {
  timeout?: number;
  maxRetries?: number;
  userAgent?: string;
}

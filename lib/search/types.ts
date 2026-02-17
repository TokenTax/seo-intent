export interface SearchResult {
  position: number;
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

export interface SearchOptions {
  location?: string;
  gl?: string; // Country code
  hl?: string; // Language code
  num?: number; // Number of results (default 10)
}

export interface SerpApiResponse {
  organic_results?: Array<{
    position: number;
    title: string;
    link: string;
    snippet: string;
    displayed_link?: string;
  }>;
  search_metadata?: {
    id: string;
    status: string;
    created_at: string;
  };
  search_parameters?: {
    q: string;
    location?: string;
    gl?: string;
    hl?: string;
  };
}

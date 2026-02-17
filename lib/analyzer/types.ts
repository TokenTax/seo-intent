import { PageData } from '../scraper/types';
import { SearchResult } from '../search/types';

export interface IntentAnalysis {
  intent: 'informational' | 'transactional' | 'navigational' | 'commercial';
  userGoal: string;
  buyerStage: 'awareness' | 'consideration' | 'decision';
  confidence: number;
  reasoning: string;
}

export interface PageAnalysis {
  position: number;
  url: string;
  title: string;
  strengths: string[];
  contentType: string;
  keyElements: string[];
  targetAudience: string;
  contentDepth: 'shallow' | 'moderate' | 'comprehensive';
  notes: string;
  pageData: PageData;
}

export interface PatternAnalysis {
  commonPatterns: Array<{
    pattern: string;
    frequency: string;
    importance: 'high' | 'medium' | 'low';
    examples: string[];
  }>;
  contentLength: {
    average: number;
    range: string;
    recommendation: string;
  };
  commonElements: string[];
  contentStructure: string;
  mustHaveElements: string[];
}

export interface Recommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  title: string;
  description: string;
  reasoning: string;
  effort: 'low' | 'medium' | 'high';
}

export interface RecommendationAnalysis {
  criticalGaps: string[];
  recommendations: Recommendation[];
  quickWins: string[];
  contentStrategy: string;
  technicalSEO: string[];
}

export interface AnalysisReport {
  keyword: string;
  targetUrl: string;
  analyzedAt: Date;
  model: string;

  intentAnalysis: IntentAnalysis;
  searchResults: SearchResult[];
  competitorAnalyses: PageAnalysis[];
  patternAnalysis: PatternAnalysis;
  targetPageData: PageData;
  recommendations: RecommendationAnalysis;
}

/**
 * Schema Monitoring - Track schema validation metrics over time
 */

import { SchemaValidationSummary, SchemaValidationResult } from './validator';

export interface SchemaMetrics {
  timestamp: Date;
  url: string;
  totalSchemas: number;
  validSchemas: number;
  invalidSchemas: number;
  errorCount: number;
  warningCount: number;
  schemaTypes: string[];
}

export interface SchemaHealthCheck {
  status: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
}

/**
 * Convert validation summary to metrics
 */
export function createMetrics(
  url: string,
  validation: SchemaValidationSummary
): SchemaMetrics {
  return {
    timestamp: new Date(),
    url,
    totalSchemas: validation.totalSchemas,
    validSchemas: validation.validSchemas,
    invalidSchemas: validation.invalidSchemas,
    errorCount: validation.totalErrors,
    warningCount: validation.totalWarnings,
    schemaTypes: validation.schemaTypes,
  };
}

/**
 * Perform a health check on schema validation results
 */
export function checkSchemaHealth(
  validation: SchemaValidationSummary
): SchemaHealthCheck {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // No schemas found
  if (validation.totalSchemas === 0) {
    issues.push('No structured data found on page');
    recommendations.push('Add JSON-LD schema markup to improve SEO');
    score -= 50;
  }

  // Invalid schemas
  if (validation.invalidSchemas > 0) {
    issues.push(`${validation.invalidSchemas} schema(s) failed validation`);
    recommendations.push('Fix schema validation errors to ensure proper indexing');
    score -= 30 * (validation.invalidSchemas / validation.totalSchemas);
  }

  // Critical errors
  if (validation.totalErrors > 0) {
    issues.push(`${validation.totalErrors} critical error(s) found in schema markup`);
    recommendations.push('Address all schema errors - they prevent proper interpretation by search engines');
    score -= 20;
  }

  // Warnings
  if (validation.totalWarnings > 0) {
    issues.push(`${validation.totalWarnings} warning(s) in schema implementation`);
    recommendations.push('Review warnings to improve schema quality');
    score -= Math.min(10, validation.totalWarnings * 2);
  }

  // Check for important schema types
  const hasArticleSchema = validation.schemaTypes.some(t =>
    ['Article', 'BlogPosting', 'NewsArticle'].includes(t)
  );
  const hasOrganizationSchema = validation.schemaTypes.includes('Organization');
  const hasBreadcrumbSchema = validation.schemaTypes.includes('BreadcrumbList');

  if (!hasArticleSchema && validation.totalSchemas > 0) {
    recommendations.push('Consider adding Article schema for better content representation');
  }

  if (!hasOrganizationSchema) {
    recommendations.push('Add Organization schema to establish site identity');
  }

  if (!hasBreadcrumbSchema) {
    recommendations.push('Add BreadcrumbList schema to improve navigation in search results');
  }

  // Determine status
  let status: 'healthy' | 'warning' | 'critical';
  if (score >= 80) {
    status = 'healthy';
  } else if (score >= 50) {
    status = 'warning';
  } else {
    status = 'critical';
  }

  return {
    status,
    score: Math.max(0, Math.round(score)),
    issues,
    recommendations,
  };
}

/**
 * Generate a human-readable health report
 */
export function formatHealthReport(health: SchemaHealthCheck): string {
  const lines: string[] = [];

  const statusEmoji = health.status === 'healthy' ? '✅' :
                      health.status === 'warning' ? '⚠️' : '❌';

  lines.push(`${statusEmoji} Schema Health: ${health.status.toUpperCase()} (Score: ${health.score}/100)`);
  lines.push('');

  if (health.issues.length > 0) {
    lines.push('Issues:');
    health.issues.forEach(issue => lines.push(`  - ${issue}`));
    lines.push('');
  }

  if (health.recommendations.length > 0) {
    lines.push('Recommendations:');
    health.recommendations.forEach(rec => lines.push(`  - ${rec}`));
  }

  return lines.join('\n');
}

/**
 * Compare schema implementations across multiple pages
 */
export function compareSchemas(
  pages: Array<{ url: string; validation: SchemaValidationSummary }>
): {
  averageSchemaCount: number;
  averageValidSchemas: number;
  averageErrorCount: number;
  commonSchemaTypes: string[];
  bestImplementation: string;
  worstImplementation: string;
} {
  if (pages.length === 0) {
    return {
      averageSchemaCount: 0,
      averageValidSchemas: 0,
      averageErrorCount: 0,
      commonSchemaTypes: [],
      bestImplementation: '',
      worstImplementation: '',
    };
  }

  const totalSchemas = pages.reduce((sum, p) => sum + p.validation.totalSchemas, 0);
  const totalValid = pages.reduce((sum, p) => sum + p.validation.validSchemas, 0);
  const totalErrors = pages.reduce((sum, p) => sum + p.validation.totalErrors, 0);

  // Find common schema types
  const allTypes = pages.flatMap(p => p.validation.schemaTypes);
  const typeCounts = allTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const commonTypes = Object.entries(typeCounts)
    .filter(([_, count]) => count >= pages.length * 0.5) // Present in at least 50% of pages
    .map(([type]) => type);

  // Find best and worst implementations
  const pageScores = pages.map(p => ({
    url: p.url,
    score: checkSchemaHealth(p.validation).score,
  }));

  pageScores.sort((a, b) => b.score - a.score);

  return {
    averageSchemaCount: totalSchemas / pages.length,
    averageValidSchemas: totalValid / pages.length,
    averageErrorCount: totalErrors / pages.length,
    commonSchemaTypes: commonTypes,
    bestImplementation: pageScores[0]?.url || '',
    worstImplementation: pageScores[pageScores.length - 1]?.url || '',
  };
}

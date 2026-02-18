/**
 * Schema Validator - Validates structured data (JSON-LD) against schema.org standards
 */

export interface SchemaValidationError {
  type: 'error' | 'warning';
  message: string;
  path?: string;
  schemaType?: string;
}

export interface SchemaValidationResult {
  isValid: boolean;
  schemaType: string;
  errors: SchemaValidationError[];
  warnings: SchemaValidationError[];
  properties: string[];
  context?: string;
  rawSchema?: any;
}

export interface SchemaValidationSummary {
  totalSchemas: number;
  validSchemas: number;
  invalidSchemas: number;
  totalErrors: number;
  totalWarnings: number;
  schemaTypes: string[];
  results: SchemaValidationResult[];
}

/**
 * Required properties for common schema types
 */
const REQUIRED_PROPERTIES: Record<string, string[]> = {
  'Article': ['headline', 'author', 'datePublished'],
  'BlogPosting': ['headline', 'author', 'datePublished'],
  'NewsArticle': ['headline', 'author', 'datePublished'],
  'FAQPage': ['mainEntity'],
  'Question': ['name', 'acceptedAnswer'],
  'Answer': ['text'],
  'Organization': ['name'],
  'Person': ['name'],
  'Product': ['name'],
  'Review': ['reviewRating', 'author'],
  'Recipe': ['name', 'recipeIngredient', 'recipeInstructions'],
  'HowTo': ['name', 'step'],
  'Event': ['name', 'startDate', 'location'],
  'LocalBusiness': ['name', 'address'],
  'VideoObject': ['name', 'description', 'thumbnailUrl', 'uploadDate'],
  'ImageObject': ['contentUrl'],
  'BreadcrumbList': ['itemListElement'],
  'WebPage': ['name'],
  'WebSite': ['name', 'url'],
};

/**
 * Recommended properties for common schema types
 */
const RECOMMENDED_PROPERTIES: Record<string, string[]> = {
  'Article': ['image', 'dateModified', 'description'],
  'BlogPosting': ['image', 'dateModified', 'description'],
  'FAQPage': [],
  'Question': [],
  'Product': ['description', 'image', 'offers'],
  'Organization': ['logo', 'url', 'sameAs'],
  'Person': ['image', 'jobTitle', 'url'],
  'Recipe': ['image', 'totalTime', 'recipeYield'],
  'LocalBusiness': ['telephone', 'priceRange', 'openingHoursSpecification'],
  'Event': ['description', 'image', 'organizer'],
};

/**
 * Validate a single schema object
 */
export function validateSchema(schemaData: any, index: number = 0): SchemaValidationResult {
  const errors: SchemaValidationError[] = [];
  const warnings: SchemaValidationError[] = [];
  const properties: string[] = Object.keys(schemaData).filter(k => !k.startsWith('@'));

  // Get schema type
  const schemaType = schemaData['@type'];
  if (!schemaType) {
    errors.push({
      type: 'error',
      message: 'Missing required @type property',
      path: `schema[${index}]`,
    });
    return {
      isValid: false,
      schemaType: 'Unknown',
      errors,
      warnings,
      properties,
      context: schemaData['@context'],
      rawSchema: schemaData,
    };
  }

  // Validate @context
  if (!schemaData['@context']) {
    warnings.push({
      type: 'warning',
      message: 'Missing @context property (recommended: https://schema.org)',
      schemaType,
    });
  } else if (
    !schemaData['@context'].includes('schema.org') &&
    !schemaData['@context'].includes('http://schema.org')
  ) {
    warnings.push({
      type: 'warning',
      message: 'Unexpected @context value, should reference schema.org',
      schemaType,
    });
  }

  // Check required properties for known schema types
  const requiredProps = REQUIRED_PROPERTIES[schemaType];
  if (requiredProps) {
    for (const prop of requiredProps) {
      if (!schemaData[prop]) {
        errors.push({
          type: 'error',
          message: `Missing required property: ${prop}`,
          path: `schema[${index}].${prop}`,
          schemaType,
        });
      }
    }
  }

  // Check recommended properties
  const recommendedProps = RECOMMENDED_PROPERTIES[schemaType];
  if (recommendedProps) {
    for (const prop of recommendedProps) {
      if (!schemaData[prop]) {
        warnings.push({
          type: 'warning',
          message: `Missing recommended property: ${prop}`,
          path: `schema[${index}].${prop}`,
          schemaType,
        });
      }
    }
  }

  // Validate nested entities
  if (schemaType === 'FAQPage' && schemaData.mainEntity) {
    const questions = Array.isArray(schemaData.mainEntity)
      ? schemaData.mainEntity
      : [schemaData.mainEntity];

    questions.forEach((question: any, qIndex: number) => {
      if (question['@type'] !== 'Question') {
        errors.push({
          type: 'error',
          message: `FAQPage mainEntity[${qIndex}] must be of type Question`,
          path: `schema[${index}].mainEntity[${qIndex}]`,
          schemaType,
        });
      }

      if (!question.acceptedAnswer) {
        errors.push({
          type: 'error',
          message: `Question[${qIndex}] missing acceptedAnswer`,
          path: `schema[${index}].mainEntity[${qIndex}].acceptedAnswer`,
          schemaType,
        });
      } else if (question.acceptedAnswer['@type'] !== 'Answer') {
        errors.push({
          type: 'error',
          message: `Question[${qIndex}] acceptedAnswer must be of type Answer`,
          path: `schema[${index}].mainEntity[${qIndex}].acceptedAnswer`,
          schemaType,
        });
      }
    });
  }

  // Check for common mistakes
  if (schemaType === 'Article' || schemaType === 'BlogPosting') {
    if (schemaData.author && typeof schemaData.author === 'string') {
      warnings.push({
        type: 'warning',
        message: 'Author should be a Person or Organization object, not a string',
        path: `schema[${index}].author`,
        schemaType,
      });
    }

    if (schemaData.datePublished) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}/;
      if (!dateRegex.test(schemaData.datePublished)) {
        warnings.push({
          type: 'warning',
          message: 'datePublished should be in ISO 8601 format (YYYY-MM-DD)',
          path: `schema[${index}].datePublished`,
          schemaType,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    schemaType,
    errors,
    warnings,
    properties,
    context: schemaData['@context'],
    rawSchema: schemaData,
  };
}

/**
 * Validate all schemas from a page
 */
export function validateSchemas(html: string): SchemaValidationSummary {
  const results: SchemaValidationResult[] = [];
  let totalErrors = 0;
  let totalWarnings = 0;
  const schemaTypes: string[] = [];

  // Extract JSON-LD scripts using regex (more reliable than DOM parsing)
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let index = 0;

  while ((match = scriptRegex.exec(html)) !== null) {
    const jsonContent = match[1].trim();

    try {
      const schemaData = JSON.parse(jsonContent);

      // Handle @graph arrays (multiple schemas in one script)
      if (schemaData['@graph'] && Array.isArray(schemaData['@graph'])) {
        schemaData['@graph'].forEach((item: any) => {
          const result = validateSchema(item, index++);
          results.push(result);
          schemaTypes.push(result.schemaType);
          totalErrors += result.errors.length;
          totalWarnings += result.warnings.length;
        });
      } else {
        const result = validateSchema(schemaData, index++);
        results.push(result);
        schemaTypes.push(result.schemaType);
        totalErrors += result.errors.length;
        totalWarnings += result.warnings.length;
      }
    } catch (error) {
      // Invalid JSON
      results.push({
        isValid: false,
        schemaType: 'ParseError',
        errors: [
          {
            type: 'error',
            message: `Failed to parse JSON-LD: ${error instanceof Error ? error.message : 'Unknown error'}`,
            path: `schema[${index}]`,
          },
        ],
        warnings: [],
        properties: [],
      });
      totalErrors++;
      schemaTypes.push('ParseError');
      index++;
    }
  }

  const validSchemas = results.filter(r => r.isValid).length;

  return {
    totalSchemas: results.length,
    validSchemas,
    invalidSchemas: results.length - validSchemas,
    totalErrors,
    totalWarnings,
    schemaTypes: [...new Set(schemaTypes)],
    results,
  };
}

/**
 * Generate a human-readable summary of validation results
 */
export function formatValidationSummary(summary: SchemaValidationSummary): string {
  if (summary.totalSchemas === 0) {
    return 'No structured data found.';
  }

  const lines: string[] = [];
  lines.push(`Found ${summary.totalSchemas} schema(s):`);
  lines.push(`- Valid: ${summary.validSchemas}`);
  lines.push(`- Invalid: ${summary.invalidSchemas}`);
  lines.push(`- Total Errors: ${summary.totalErrors}`);
  lines.push(`- Total Warnings: ${summary.totalWarnings}`);
  lines.push(`- Types: ${summary.schemaTypes.join(', ')}`);

  return lines.join('\n');
}

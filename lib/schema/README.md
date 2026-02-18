# Schema Validation & Monitoring

This module provides comprehensive structured data (JSON-LD) validation and monitoring capabilities for SEO analysis.

## Features

### 1. Schema Validation (`validator.ts`)

Validates JSON-LD structured data against schema.org standards:

- **Syntax Validation**: Ensures JSON is well-formed
- **Required Properties**: Checks for mandatory fields per schema type
- **Recommended Properties**: Warns about missing optional but recommended fields
- **Nested Validation**: Validates nested entities (e.g., Questions in FAQPage)
- **Common Mistakes**: Detects typical implementation errors

#### Supported Schema Types

The validator includes validation rules for:
- Article, BlogPosting, NewsArticle
- FAQPage, Question, Answer
- Organization, Person
- Product, Review
- Recipe, HowTo
- Event, LocalBusiness
- VideoObject, ImageObject
- BreadcrumbList
- WebPage, WebSite

#### Usage

```typescript
import { validateSchemas } from './lib/schema/validator';

const html = '<html>...</html>';
const summary = validateSchemas(html);

console.log(`Found ${summary.totalSchemas} schemas`);
console.log(`Valid: ${summary.validSchemas}, Invalid: ${summary.invalidSchemas}`);
console.log(`Errors: ${summary.totalErrors}, Warnings: ${summary.totalWarnings}`);

// Check individual schema results
summary.results.forEach(result => {
  console.log(`Schema: ${result.schemaType}, Valid: ${result.isValid}`);
  result.errors.forEach(err => console.log(`Error: ${err.message}`));
});
```

### 2. Schema Monitoring (`monitor.ts`)

Provides health checks and monitoring capabilities:

- **Health Scoring**: 0-100 score based on validation results
- **Status Assessment**: Healthy / Warning / Critical
- **Issue Detection**: Identifies problems with schema implementation
- **Recommendations**: Suggests improvements
- **Comparison**: Compare schema implementations across multiple pages

#### Health Check Example

```typescript
import { checkSchemaHealth, formatHealthReport } from './lib/schema/monitor';

const health = checkSchemaHealth(validationSummary);
console.log(formatHealthReport(health));
```

Output:
```
✅ Schema Health: HEALTHY (Score: 98/100)

Issues:
  - 1 warning(s) in schema implementation

Recommendations:
  - Review warnings to improve schema quality
  - Add Organization schema to establish site identity
```

#### Multi-Page Comparison

```typescript
import { compareSchemas } from './lib/schema/monitor';

const pages = [
  { url: 'page1.html', validation: summary1 },
  { url: 'page2.html', validation: summary2 },
];

const comparison = compareSchemas(pages);
console.log(`Average schemas per page: ${comparison.averageSchemaCount}`);
console.log(`Common types: ${comparison.commonSchemaTypes.join(', ')}`);
console.log(`Best implementation: ${comparison.bestImplementation}`);
```

### 3. Integration with Scraper

The schema validator is automatically integrated into the page scraping process:

```typescript
import { extractPageData } from './lib/scraper/extractor';

const pageData = await extractPageData(url);

// Schema validation results are included
console.log(pageData.schemaValidation);
```

The `PageData` interface includes:
- `hasSchema`: Boolean indicating presence
- `schemaTypes`: Array of detected schema types
- `schemaValidation`: Complete validation results (optional)

### 4. Report Integration

Schema validation results are automatically included in analysis reports:

```markdown
#### Schema Validation

- **Total Schemas:** 2
- **Valid:** 2 ✓
- **Invalid:** 0
- **Errors:** 0 ✓
- **Warnings:** 1 ⚠️

**Validation Details:**

**Schema 1: Article**
- Warnings:
  - ⚠️ Missing recommended property: image

**Schema 2: FAQPage**
- No issues
```

## Validation Rules

### Required Properties by Schema Type

| Schema Type | Required Properties |
|-------------|-------------------|
| Article | headline, author, datePublished |
| FAQPage | mainEntity |
| Question | name, acceptedAnswer |
| Answer | text |
| Organization | name |
| Product | name |
| Event | name, startDate, location |

### Common Validation Checks

1. **@context**: Must reference schema.org
2. **@type**: Required for all schemas
3. **Date Format**: ISO 8601 (YYYY-MM-DD)
4. **Author**: Should be Person/Organization object, not string
5. **Nested Entities**: Proper @type for nested objects
6. **FAQPage Questions**: Must have acceptedAnswer of type Answer

## Testing

Run the test suite:

```bash
npm test -- lib/schema/__tests__/validator.test.ts
```

Run manual validation test:

```bash
npx tsx test-schema-validation.ts
```

Test with specific URL:

```bash
TEST_URL=https://example.com npx tsx test-schema-validation.ts
```

## Monitoring Best Practices

1. **Regular Validation**: Validate schema on each page scrape
2. **Track Metrics**: Monitor validation scores over time
3. **Address Errors First**: Fix critical errors before warnings
4. **Benchmark Competitors**: Compare your schema implementation
5. **Continuous Improvement**: Aim for 90+ health scores

## Error Severity

- **Errors** (❌): Critical issues preventing proper interpretation
  - Missing required properties
  - Invalid JSON syntax
  - Wrong data types
  - Invalid nested structure

- **Warnings** (⚠️): Issues that may reduce effectiveness
  - Missing recommended properties
  - Suboptimal formats
  - Missing @context
  - Author as string instead of object

## Performance Considerations

- Validation runs on raw HTML (regex-based extraction)
- No external API calls required
- Lightweight validation rules
- Results cached with page data
- Minimal impact on scraping performance

## Future Enhancements

Potential improvements:
- Integration with Google's Rich Results Test API
- Schema completeness scoring
- Historical trend tracking
- Automated fix suggestions
- Custom validation rules
- Schema generation helpers

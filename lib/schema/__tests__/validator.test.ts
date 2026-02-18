import { validateSchema, validateSchemas, SchemaValidationSummary } from '../validator';

describe('Schema Validator', () => {
  describe('validateSchema', () => {
    it('should validate a valid Article schema', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test Article',
        author: {
          '@type': 'Person',
          name: 'John Doe',
        },
        datePublished: '2024-01-01',
      };

      const result = validateSchema(schema);

      expect(result.isValid).toBe(true);
      expect(result.schemaType).toBe('Article');
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required properties', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test Article',
        // Missing author and datePublished
      };

      const result = validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('author'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('datePublished'))).toBe(true);
    });

    it('should detect missing @type', () => {
      const schema = {
        '@context': 'https://schema.org',
        headline: 'Test Article',
      };

      const result = validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('@type'))).toBe(true);
    });

    it('should warn about missing @context', () => {
      const schema = {
        '@type': 'Article',
        headline: 'Test Article',
        author: { '@type': 'Person', name: 'John' },
        datePublished: '2024-01-01',
      };

      const result = validateSchema(schema);

      expect(result.warnings.some(w => w.message.includes('@context'))).toBe(true);
    });

    it('should validate FAQPage schema', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is this?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'This is a test.',
            },
          },
        ],
      };

      const result = validateSchema(schema);

      expect(result.isValid).toBe(true);
      expect(result.schemaType).toBe('FAQPage');
      expect(result.errors).toHaveLength(0);
    });

    it('should detect FAQPage validation errors', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is this?',
            // Missing acceptedAnswer
          },
        ],
      };

      const result = validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('acceptedAnswer'))).toBe(true);
    });

    it('should warn about author as string instead of object', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test Article',
        author: 'John Doe', // Should be object
        datePublished: '2024-01-01',
      };

      const result = validateSchema(schema);

      expect(result.warnings.some(w => w.message.includes('Author should be'))).toBe(true);
    });

    it('should warn about invalid date format', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test Article',
        author: { '@type': 'Person', name: 'John' },
        datePublished: '01/01/2024', // Wrong format
      };

      const result = validateSchema(schema);

      expect(result.warnings.some(w => w.message.includes('ISO 8601'))).toBe(true);
    });
  });

  describe('validateSchemas', () => {
    it('should extract and validate schemas from HTML', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "Test",
              "author": {"@type": "Person", "name": "John"},
              "datePublished": "2024-01-01"
            }
            </script>
          </head>
          <body></body>
        </html>
      `;

      const summary = validateSchemas(html);

      expect(summary.totalSchemas).toBe(1);
      expect(summary.validSchemas).toBe(1);
      expect(summary.invalidSchemas).toBe(0);
      expect(summary.schemaTypes).toContain('Article');
    });

    it('should handle multiple schemas', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "Test",
              "author": {"@type": "Person", "name": "John"},
              "datePublished": "2024-01-01"
            }
            </script>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Test Org"
            }
            </script>
          </head>
          <body></body>
        </html>
      `;

      const summary = validateSchemas(html);

      expect(summary.totalSchemas).toBe(2);
      expect(summary.schemaTypes).toContain('Article');
      expect(summary.schemaTypes).toContain('Organization');
    });

    it('should handle @graph arrays', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Article",
                  "headline": "Test",
                  "author": {"@type": "Person", "name": "John"},
                  "datePublished": "2024-01-01"
                },
                {
                  "@type": "Organization",
                  "name": "Test Org"
                }
              ]
            }
            </script>
          </head>
          <body></body>
        </html>
      `;

      const summary = validateSchemas(html);

      expect(summary.totalSchemas).toBe(2);
      expect(summary.schemaTypes).toContain('Article');
      expect(summary.schemaTypes).toContain('Organization');
    });

    it('should handle invalid JSON', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org"
              "@type": "Article", // Invalid JSON - missing comma
            }
            </script>
          </head>
          <body></body>
        </html>
      `;

      const summary = validateSchemas(html);

      expect(summary.totalSchemas).toBe(1);
      expect(summary.invalidSchemas).toBe(1);
      expect(summary.totalErrors).toBeGreaterThan(0);
      expect(summary.schemaTypes).toContain('ParseError');
    });

    it('should return empty summary when no schemas found', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head></head>
          <body>No schemas here</body>
        </html>
      `;

      const summary = validateSchemas(html);

      expect(summary.totalSchemas).toBe(0);
      expect(summary.validSchemas).toBe(0);
      expect(summary.invalidSchemas).toBe(0);
      expect(summary.totalErrors).toBe(0);
      expect(summary.schemaTypes).toHaveLength(0);
    });
  });
});

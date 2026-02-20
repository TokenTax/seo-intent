'use client';

import { useState } from 'react';
import ResultsDisplay from '@/components/ResultsDisplay';

// Small 1x1 red pixel as base64 PNG
const RED_PIXEL_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

// Small 1x1 blue pixel as base64 JPEG
const BLUE_PIXEL_JPEG = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';

// 10x10 gradient as base64 PNG
const GRADIENT_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAVklEQVQYV2NkwA/+M2IR/88AV4hZBJeJ/xkZGRn/M+BSmJCQwPCfgQFVIUwRw38GRgb8CkFuRVaILPafgRGPG9AVMjLCzcClEOYcdIWMjMgKkRXC1AIAJpIjF1h8JVIAAAAASUVORK5CYII=';

const testMarkdown = `
# Markdown Preview Test Page

This page tests various markdown features with base64 images.

---

## Test 1: Direct Base64 Image (PNG)

This is a 1x1 red pixel PNG embedded directly:

![Red Pixel PNG](data:image/png;base64,${RED_PIXEL_PNG})

---

## Test 2: Direct Base64 Image (JPEG)

This is a 1x1 blue pixel JPEG embedded directly:

![Blue Pixel JPEG](data:image/jpeg;base64,${BLUE_PIXEL_JPEG})

---

## Test 3: Larger Base64 Image (10x10 Gradient)

![Gradient PNG](data:image/png;base64,${GRADIENT_PNG})

---

## Test 4: Image in Details/Summary (How screenshots appear)

<details>
  <summary>View Screenshot</summary>
  <p><img src="data:image/png;base64,${GRADIENT_PNG}" alt="Screenshot in details" /></p>
</details>

---

## Test 5: Image Without Alt Text

<img src="data:image/png;base64,${RED_PIXEL_PNG}" />

---

## Test 6: Image with HTML img tag

<img src="data:image/png;base64,${GRADIENT_PNG}" alt="HTML img tag" style="width: 100px; height: 100px;" />

---

## Test 7: Multiple Images in Details

<details>
  <summary>View Multiple Screenshots</summary>
  <p><img src="data:image/png;base64,${RED_PIXEL_PNG}" alt="Screenshot 1" /></p>
  <p><img src="data:image/jpeg;base64,${BLUE_PIXEL_JPEG}" alt="Screenshot 2" /></p>
  <p><img src="data:image/png;base64,${GRADIENT_PNG}" alt="Screenshot 3" /></p>
</details>

---

## Test 8: External URL Image (for comparison)

![Placeholder Image](https://via.placeholder.com/150)

---

## Test 9: Broken Image Test

![Broken Image](data:image/png;base64,INVALID_BASE64_HERE)

---

## Test 10: Very Long Base64 String Test

The following tests a scenario with a longer base64 string (duplicated gradient):

<details>
  <summary>View Large Base64 Image</summary>
  <p><img src="data:image/png;base64,${GRADIENT_PNG}${GRADIENT_PNG.slice(50)}" alt="Potentially broken due to concatenation" /></p>
</details>

---

## Other Markdown Elements

### Code Block
\`\`\`javascript
const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAE...';
const img = document.createElement('img');
img.src = \`data:image/png;base64,\${base64}\`;
\`\`\`

### Inline Code
Use \`data:image/png;base64,<base64-string>\` format for embedding images.

### Table

| Test | Format | Status |
|------|--------|--------|
| Test 1 | PNG | Check above |
| Test 2 | JPEG | Check above |
| Test 3 | Gradient | Check above |

### Blockquote

> Base64 images should render inline without requiring external requests.

### List

1. Check if images render
2. Check if details/summary works
3. Check console for errors
4. Verify image dimensions

---

## Debug Info

- Check browser console for any image loading errors
- Inspect the img elements to see if src is correctly set
- Verify that rehype-raw is processing the HTML correctly
`;

export default function TestMarkdownPage() {
  const [rawView, setRawView] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Native HTML test - outside ReactMarkdown */}
        <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h2 className="font-semibold text-green-800 dark:text-green-200 mb-4">
            Native HTML Test (NOT ReactMarkdown)
          </h2>
          <p className="text-green-700 dark:text-green-300 text-sm mb-4">
            If these images work, the issue is with ReactMarkdown. If broken, it&apos;s a browser/CSP issue.
          </p>
          <div className="flex gap-4 items-center">
            <div className="text-center">
              <img
                src={`data:image/png;base64,${RED_PIXEL_PNG}`}
                alt="Native Red Pixel"
                style={{ width: 50, height: 50, border: '2px solid green' }}
              />
              <p className="text-xs mt-1 text-green-600">PNG (50x50)</p>
            </div>
            <div className="text-center">
              <img
                src={`data:image/jpeg;base64,${BLUE_PIXEL_JPEG}`}
                alt="Native Blue Pixel"
                style={{ width: 50, height: 50, border: '2px solid blue' }}
              />
              <p className="text-xs mt-1 text-green-600">JPEG (50x50)</p>
            </div>
            <div className="text-center">
              <img
                src={`data:image/png;base64,${GRADIENT_PNG}`}
                alt="Native Gradient"
                style={{ width: 50, height: 50, border: '2px solid purple' }}
              />
              <p className="text-xs mt-1 text-green-600">Gradient (50x50)</p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Markdown Preview Test
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setRawView(!rawView)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                rawView
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              {rawView ? 'Show Rendered' : 'Show Raw Markdown'}
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Home
            </a>
          </div>
        </div>

        {rawView ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 dark:text-gray-200 overflow-auto">
              {testMarkdown}
            </pre>
          </div>
        ) : (
          <ResultsDisplay markdown={testMarkdown} keyword="test" />
        )}

        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h2 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Debugging Tips
          </h2>
          <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 text-sm space-y-1">
            <li>Open browser DevTools (F12) and check Console for errors</li>
            <li>Inspect image elements to verify src attribute</li>
            <li>Check Network tab to see if any external requests are made</li>
            <li>Toggle &quot;Show Raw Markdown&quot; to compare source vs rendered</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

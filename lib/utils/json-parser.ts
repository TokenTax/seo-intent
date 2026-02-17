/**
 * Fix common JSON formatting issues from LLMs
 */
function fixCommonJsonIssues(text: string): string {
  let fixed = text;

  // Remove trailing commas before closing brackets/braces
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

  // Remove comments (// and /* */)
  fixed = fixed.replace(/\/\/.*$/gm, '');
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');

  // Fix single quotes to double quotes (but be careful with apostrophes in content)
  // Only fix quotes around keys and simple string values
  fixed = fixed.replace(/(\{|,)\s*'([^']+)'\s*:/g, '$1"$2":');

  // Fix missing commas between array elements (common LLM error)
  // Look for }\n{ or ]\n[ patterns without comma
  fixed = fixed.replace(/\}(\s*)\{/g, '},$1{');
  fixed = fixed.replace(/\](\s*)\[/g, '],$1[');

  // Fix missing commas between object properties and array elements
  // Look for "value"\n" patterns
  fixed = fixed.replace(/"(\s*)\n(\s*)"(?=[^:]*:)/g, '",$1\n$2"');

  // Fix missing commas after closing brace/bracket when followed by opening quote
  fixed = fixed.replace(/\}(\s*)"(?=[^:]*:)/g, '},$1"');
  fixed = fixed.replace(/\](\s*)"/g, '],$1"');

  return fixed;
}

/**
 * Parse JSON from LLM response, handling markdown code blocks and common formatting issues
 */
export function parseJsonFromLLM(text: string): any {
  // Remove markdown code blocks if present
  let cleaned = text.trim();

  // Check if wrapped in ```json ... ``` or ``` ... ```
  const codeBlockRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
  const match = cleaned.match(codeBlockRegex);

  if (match) {
    cleaned = match[1].trim();
  }

  // Try to parse directly first
  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    const errorMsg = firstError instanceof Error ? firstError.message : 'Unknown error';
    console.log('[JSONParser] Initial parse failed:', errorMsg);
    console.log('[JSONParser] Attempting to fix common issues...');

    // Try fixing common issues
    try {
      const fixed = fixCommonJsonIssues(cleaned);
      return JSON.parse(fixed);
    } catch (secondError) {
      console.log('[JSONParser] Fix attempt failed, trying to extract JSON object...');

      // Log problematic area for debugging
      if (secondError instanceof Error && secondError.message.includes('position')) {
        const posMatch = secondError.message.match(/position (\d+)/);
        if (posMatch) {
          const pos = parseInt(posMatch[1]);
          const start = Math.max(0, pos - 200);
          const end = Math.min(cleaned.length, pos + 200);
          console.error('[JSONParser] Context around error position:');
          console.error(cleaned.substring(start, end));
        }
      }

      // Last resort: extract the JSON object
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const fixed = fixCommonJsonIssues(jsonMatch[0]);
          return JSON.parse(fixed);
        } catch (thirdError) {
          // Save the full JSON to help debug
          console.error('[JSONParser] Failed to parse JSON after all attempts.');
          console.error('[JSONParser] JSON length:', cleaned.length);
          console.error('[JSONParser] First 1000 chars:', cleaned.substring(0, 1000));
          console.error('[JSONParser] Last 500 chars:', cleaned.substring(Math.max(0, cleaned.length - 500)));
          console.error('[JSONParser] Error:', thirdError);
          throw new Error(`Failed to parse JSON: ${thirdError instanceof Error ? thirdError.message : 'Unknown error'}`);
        }
      }

      throw new Error(`Failed to parse JSON: ${errorMsg}`);
    }
  }
}

/**
 * Cleans up messy WooCommerce product names for display.
 *
 * Handles names like:
 *   "Release Film for ( LD-006 – HALOT SKY – ... – HALOT LITE )"
 *   "Nozzle Kit ( K1 – K1 Max – ... )"
 *
 * Rules applied in order:
 *   1. Remove " – ..." and everything after it up to the closing ")"
 *      so "(Model A – Model B – ... – Model Z)" → "(Model A – Model B)"
 *   2. Remove any remaining standalone "..."
 *   3. Remove now-empty parentheses "( )"
 *   4. Remove a trailing " –" or " –" left at the end
 *   5. Collapse multiple spaces and trim
 */
// Matches three literal periods OR the Unicode ellipsis character (…)
const ELLIPSIS = /(?:\.\.\.|…)/;
const DASH = /[–—\-]/;

const MAX_NAME_LENGTH = 40;

export function cleanProductName(name: string): string {
  const cleaned = name
    // 1. Remove " – ..." (or " – …") and everything after it up to ")"
    //    e.g. "( LD-006 – HALOT SKY – ... – HALOT LITE )" → "( LD-006 – HALOT SKY )"
    .replace(new RegExp(`\\s*${DASH.source}\\s*${ELLIPSIS.source}.*?\\)`, "g"), ")")
    // 2. Remove any remaining standalone ellipsis
    .replace(new RegExp(`\\s*${ELLIPSIS.source}\\s*`, "g"), " ")
    // 3. Remove empty or whitespace-only parens
    .replace(/\(\s*\)/g, "")
    // 4. Remove trailing dash/en-dash
    .replace(new RegExp(`\\s*${DASH.source}\\s*$`), "")
    // 5. Collapse extra whitespace
    .replace(/\s{2,}/g, " ")
    .trim();

  // 6. Hard truncate if still too long, breaking at a word boundary
  if (cleaned.length <= MAX_NAME_LENGTH) return cleaned;

  const truncated = cleaned.slice(0, MAX_NAME_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

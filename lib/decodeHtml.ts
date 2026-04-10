/**
 * Decode common HTML entities in product names coming from WooCommerce.
 * Works in both server and client environments (no DOM dependency).
 */
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#039;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&#8211;": "\u2013", // en dash –
  "&#8212;": "\u2014", // em dash —
  "&#8216;": "\u2018", // left single quote '
  "&#8217;": "\u2019", // right single quote '
  "&#8220;": "\u201C", // left double quote "
  "&#8221;": "\u201D", // right double quote "
  "&#8230;": "\u2026", // ellipsis …
  "&#8482;": "\u2122", // trademark ™
  "&#174;": "\u00AE",  // registered ®
  "&#169;": "\u00A9",  // copyright ©
};

const NAMED_RE = /&[a-zA-Z]+;/g;
const NUMERIC_RE = /&#(\d+);/g;

export function decodeHtmlEntities(str: string): string {
  return str
    .replace(NAMED_RE, (match) => ENTITIES[match] ?? match)
    .replace(NUMERIC_RE, (_, code) => String.fromCharCode(Number(code)));
}

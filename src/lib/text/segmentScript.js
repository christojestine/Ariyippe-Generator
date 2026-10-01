/**
 * segmentScript.js
 *
 * Splits formatted runs into script segments. The print font for Malayalam
 * (ML-TT encoding) maps ASCII codes to Malayalam glyphs, so anything that is
 * not Malayalam (English, digits, punctuation, ₹) must be drawn with a Latin
 * font instead.
 */

const MALAYALAM_RE = /[ഀ-ൿ‌‍]/;

/** @param {string} ch */
export function isMalayalamChar(ch) {
  return MALAYALAM_RE.test(ch);
}

/**
 * @param {string} text
 * @returns {Array<{ text: string, script: "ml" | "latin" }>}
 */
export function segmentText(text) {
  const segments = [];
  for (const ch of text) {
    const script = isMalayalamChar(ch) ? "ml" : "latin";
    const last = segments[segments.length - 1];
    if (last && last.script === script) last.text += ch;
    else segments.push({ text: ch, script });
  }
  return segments;
}

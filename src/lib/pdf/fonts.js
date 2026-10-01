/**
 * fonts.js
 *
 * Fonts embedded in every PDF:
 *  - NiyokkamPooram: patched ML-TT Pooram for Malayalam (ML-TT glyph codes,
 *    see lib/mltt). Has no bold/italic faces, so those are simulated.
 *  - Noto Serif (Regular/Bold/Italic/BoldItalic): English, digits, ₹, bullets.
 *
 * Embedding the fonts makes the PDF look the same on every device, whatever
 * fonts are installed there.
 */

export const ML_FONT = "NiyokkamPooram";
export const LATIN_FONT = "NotoSerif";

/** Font file names, keyed by the bytes object's property names. */
export const FONT_FILES = {
  pooram: "NiyokkamPooram.ttf",
  serifRegular: "NotoSerif-Regular.ttf",
  serifBold: "NotoSerif-Bold.ttf",
  serifItalic: "NotoSerif-Italic.ttf",
  serifBoldItalic: "NotoSerif-BoldItalic.ttf",
};

/**
 * @typedef {Record<keyof typeof FONT_FILES, Uint8Array>} FontBytes
 */

/** @param {Uint8Array} bytes */
function toBase64(bytes) {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/**
 * Registers all fonts on a jsPDF document.
 *
 * @param {import("jspdf").jsPDF} doc
 * @param {FontBytes} bytes
 */
export function registerFonts(doc, bytes) {
  const add = (key, family, style) => {
    doc.addFileToVFS(FONT_FILES[key], toBase64(bytes[key]));
    doc.addFont(FONT_FILES[key], family, style);
  };
  add("pooram", ML_FONT, "normal");
  add("serifRegular", LATIN_FONT, "normal");
  add("serifBold", LATIN_FONT, "bold");
  add("serifItalic", LATIN_FONT, "italic");
  add("serifBoldItalic", LATIN_FONT, "bolditalic");
}

/** jsPDF font style name for the Latin font. */
export function latinStyle(bold, italic) {
  if (bold && italic) return "bolditalic";
  if (bold) return "bold";
  if (italic) return "italic";
  return "normal";
}

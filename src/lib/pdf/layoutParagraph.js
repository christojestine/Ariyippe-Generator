/**
 * layoutParagraph.js
 *
 * Breaks formatted runs into positioned lines. Pure: text measurement is
 * injected, so this runs under node --test without jsPDF.
 *
 * Each run is split into words (at spaces) and each word into script
 * fragments (Malayalam vs Latin). Malayalam fragments are converted to ML-TT
 * glyph codes here, so measurement and drawing both see the final glyphs.
 */

import { unicode2ascii } from "../mltt/unicode2ascii.js";
import { segmentText } from "../text/segmentScript.js";

/**
 * @typedef {{ script: "ml" | "latin", bold: boolean, italic: boolean }} FontSpec
 * @typedef {(text: string, font: FontSpec, size: number) => number} MeasureFn
 *
 * @typedef {object} Fragment
 * @property {string} text        text to draw (ML-TT glyph codes for "ml")
 * @property {"ml" | "latin"} script
 * @property {boolean} bold
 * @property {boolean} italic
 * @property {boolean} underline
 * @property {number} size        font size in pt
 * @property {number} width
 * @property {number} x           offset from the paragraph's left edge
 *
 * @typedef {{ fragments: Fragment[], underlines: Array<{ x1: number, x2: number }>, width: number }} Line
 */

/**
 * @param {Array<{ text: string, bold: boolean, italic: boolean, underline: boolean }>} runs
 * @param {object} opts
 * @param {number} opts.maxWidth
 * @param {MeasureFn} opts.measure
 * @param {{ ml: number, latin: number }} opts.sizes   font sizes in pt
 * @param {"justify" | "left" | "center" | "right"} [opts.align]
 * @returns {Line[]}
 */
export function layoutParagraph(runs, { maxWidth, measure, sizes, align = "justify" }) {
  const words = toWords(runs, measure, sizes);

  /** @type {Array<{ words: typeof words, forced: boolean }>} */
  const rawLines = [];
  let current = [];
  let currentWidth = 0;

  const flush = (forced) => {
    rawLines.push({ words: current, forced });
    current = [];
    currentWidth = 0;
  };

  for (const word of words) {
    if (word.newline) {
      flush(true);
      continue;
    }
    const gap = current.length ? current[current.length - 1].spaceAfter : 0;
    if (current.length && currentWidth + gap + word.width > maxWidth) flush(false);
    const gapNow = current.length ? current[current.length - 1].spaceAfter : 0;
    currentWidth += gapNow + word.width;
    current.push(word);
  }
  flush(true);

  return rawLines.map(({ words: lineWords, forced }, index) => {
    const isLast = index === rawLines.length - 1;
    const wordsWidth = lineWords.reduce((sum, w) => sum + w.width, 0);
    const naturalGaps = lineWords.slice(0, -1).reduce((sum, w) => sum + w.spaceAfter, 0);
    const naturalWidth = wordsWidth + naturalGaps;

    const justify = align === "justify" && !forced && !isLast && lineWords.length > 1;
    const extra = justify ? (maxWidth - naturalWidth) / (lineWords.length - 1) : 0;

    let x = 0;
    if (align === "center") x = (maxWidth - naturalWidth) / 2;
    else if (align === "right") x = maxWidth - naturalWidth;

    const fragments = [];
    const underlines = [];
    lineWords.forEach((word, wi) => {
      for (const frag of word.fragments) {
        fragments.push({ ...frag, x });
        if (frag.underline) addUnderline(underlines, x, x + frag.width);
        x += frag.width;
      }
      if (wi < lineWords.length - 1) {
        const gap = word.spaceAfter + extra;
        const next = lineWords[wi + 1];
        if (word.spaceUnderlined && lastFrag(word).underline && next.fragments[0]?.underline) {
          addUnderline(underlines, x, x + gap);
        }
        x += gap;
      }
    });

    return { fragments, underlines, width: justify ? maxWidth : naturalWidth };
  });
}

function lastFrag(word) {
  return word.fragments[word.fragments.length - 1] ?? {};
}

function addUnderline(list, x1, x2) {
  const last = list[list.length - 1];
  if (last && Math.abs(last.x2 - x1) < 0.01) last.x2 = x2;
  else list.push({ x1, x2 });
}

/**
 * Splits runs into words: { fragments, width, spaceAfter, spaceUnderlined }
 * or { newline: true } markers.
 */
function toWords(runs, measure, sizes) {
  const words = [];
  let word = null;

  const endWord = () => {
    if (word) words.push(word);
    word = null;
  };

  for (const run of runs) {
    // Tokens: words, spaces and newlines.
    for (const token of run.text.split(/(\n| +)/)) {
      if (!token) continue;
      if (token === "\n") {
        endWord();
        words.push({ newline: true });
        continue;
      }
      if (token.trim() === "") {
        if (word) {
          // Space width is measured once per word; multiple spaces collapse.
          word.spaceAfter = measure(" ", { script: "latin", bold: run.bold, italic: run.italic }, sizes.latin);
          word.spaceUnderlined = run.underline;
          endWord();
        }
        continue;
      }
      if (!word) word = { fragments: [], width: 0, spaceAfter: 0, spaceUnderlined: false };
      for (const seg of segmentText(token)) {
        const text = seg.script === "ml" ? unicode2ascii(seg.text) : seg.text;
        const size = sizes[seg.script];
        const width = measure(text, { script: seg.script, bold: run.bold, italic: run.italic }, size);
        word.fragments.push({
          text,
          script: seg.script,
          bold: run.bold,
          italic: run.italic,
          underline: run.underline,
          size,
          width,
          x: 0,
        });
        word.width += width;
      }
    }
  }
  endWord();
  return words;
}

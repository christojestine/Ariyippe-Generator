/**
 * buildAriyippuPdf.js
 *
 * Builds the weekly notice PDF in the layout of the parish's printed
 * Ariyippu: church header with logo (first page only), underlined title with
 * date, numbered / bulleted sections with justified text, and the vicar's
 * signature. No item is ever split across pages (see paginate.js).
 *
 * Works in the browser and under Node — fonts are passed in as bytes.
 */

import { jsPDF } from "jspdf";
import { richDocToRuns, isRichDocEmpty } from "../text/richDoc.js";
import { layoutParagraph } from "./layoutParagraph.js";
import { paginate } from "./paginate.js";
import { ML_FONT, LATIN_FONT, registerFonts, latinStyle } from "./fonts.js";

// ── Page geometry (pt, A4 portrait) ─────────────────────────────────────────
const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = { top: 36, bottom: 42, left: 50, right: 40 };
const CONTENT_RIGHT = PAGE.width - MARGIN.right;

// ── Typography ──────────────────────────────────────────────────────────────
// ML-TT Pooram draws ~25% smaller than Noto Serif at the same point size, so
// Malayalam is set larger to match the visual size of Latin text and digits.
const BODY = { ml: 15, latin: 11 };
const BODY_LINE = 19;
const TITLE = { ml: 20, latin: 15 };
const TITLE_LINE = 26;
const HEADER_COLOR = { name: [31, 56, 100], sub: [38, 70, 125], text: [61, 80, 115] };
const ITALIC_SHEAR = Math.tan((12 * Math.PI) / 180);
const FAUX_BOLD_EM = 0.03; // stroke width relative to font size
const UNDERLINE = { offset: 2, width: 0.6 };

// ── Lists ───────────────────────────────────────────────────────────────────
const LIST = {
  numbered: { markerX: MARGIN.left + 12, textX: MARGIN.left + 32 },
  bulleted: { markerX: MARGIN.left + 40, textX: MARGIN.left + 60 },
  line: { markerX: 0, textX: MARGIN.left + 12 },
};
const BULLET_RADIUS = 2.6;
const ITEM_GAP = 1.5;
const SECTION_GAP = 14;

/**
 * @typedef {object} Notice
 * @property {{ logoMode?: "default" | "custom" | "none", logoDataUrl?: string, churchName: string, subtitle: string, addressLine1: string, addressLine2: string, title: string }} header
 * @property {string} noticeDate
 * @property {Array<{ id: string, kind: "numbered" | "bulleted" | "line", heading: object | null, items: Array<{ id: string, content: object }> }>} sections
 * @property {{ name: string, title: string }} signature
 */

/**
 * @param {Notice} notice
 * @param {import("./fonts.js").FontBytes} fontBytes
 * @param {{ logo?: { data: string | Uint8Array, width: number, height: number } | null }} [assets]
 *        logo image to print in the header (PNG/JPEG bytes or data URL, with its
 *        pixel size), or null for none
 * @returns {{ doc: import("jspdf").jsPDF, pageCount: number, oversizedItemIds: string[] }}
 */
export function buildAriyippuPdf(notice, fontBytes, { logo = null } = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  registerFonts(doc, fontBytes);

  const measure = (text, font, size) => {
    setFont(doc, font.script, font.bold, font.italic, size);
    return doc.getTextWidth(text);
  };

  const blocks = buildBlocks(doc, notice, logo, measure);
  const { placements, pageCount, oversized } = paginate(blocks, {
    top: MARGIN.top,
    bottom: PAGE.height - MARGIN.bottom,
  });

  for (let p = 1; p < pageCount; p++) doc.addPage("a4", "portrait");
  for (const placement of placements) {
    doc.setPage(placement.page + 1);
    blocks[placement.block].draw(placement.y, placement.fromLine, placement.toLine);
  }

  const oversizedItemIds = oversized.map((i) => blocks[i].itemId).filter(Boolean);
  return { doc, pageCount, oversizedItemIds };
}

// ── Blocks ──────────────────────────────────────────────────────────────────

function buildBlocks(doc, notice, logo, measure) {
  const blocks = [headerBlock(doc, notice.header, logo)];

  blocks.push(
    paragraphBlock(doc, {
      runs: [{ text: `${notice.header.title}  ${notice.noticeDate}`.trim(), bold: true, italic: false, underline: true }],
      x: MARGIN.left,
      width: CONTENT_RIGHT - MARGIN.left,
      align: "center",
      sizes: TITLE,
      lineHeight: TITLE_LINE,
      spaceBefore: 6,
      measure,
    }),
  );

  // Space between the title and the first section.
  let firstContent = true;

  for (const section of notice.sections) {
    const items = section.items.filter((item) => !isRichDocEmpty(item.content));
    const hasHeading = section.heading && !isRichDocEmpty(section.heading);
    if (!items.length) continue; // empty sections are skipped, heading included

    if (hasHeading) {
      blocks.push(
        paragraphBlock(doc, {
          runs: richDocToRuns(section.heading),
          x: MARGIN.left,
          width: CONTENT_RIGHT - MARGIN.left,
          align: "left",
          sizes: BODY,
          lineHeight: BODY_LINE,
          spaceBefore: firstContent ? 14 : SECTION_GAP,
          keepWithNext: true,
          measure,
        }),
      );
    }

    const list = LIST[section.kind] ?? LIST.numbered;
    items.forEach((item, i) => {
      const marker =
        section.kind === "numbered"
          ? { text: `${i + 1}.`, script: "latin", size: BODY.latin }
          : section.kind === "bulleted"
            ? { bullet: true }
            : null;
      const block = paragraphBlock(doc, {
        runs: richDocToRuns(item.content),
        x: list.textX,
        width: CONTENT_RIGHT - list.textX,
        align: "justify",
        sizes: BODY,
        lineHeight: BODY_LINE,
        spaceBefore: i === 0 ? (hasHeading ? 4 : firstContent ? 14 : SECTION_GAP) : ITEM_GAP,
        marker: marker && { ...marker, x: list.markerX },
        measure,
      });
      block.itemId = item.id;
      blocks.push(block);
    });

    firstContent = false;
  }

  // The signature never stands alone on the last page.
  blocks[blocks.length - 1].keepWithNext = true;
  blocks.push(signatureBlock(doc, notice.signature, measure));
  return blocks;
}

/**
 * A block of wrapped text. Optional marker (number / bullet) is drawn on the
 * first line, in a hanging-indent column.
 */
function paragraphBlock(doc, { runs, x, width, align, sizes, lineHeight, spaceBefore, keepWithNext, marker, measure }) {
  const lines = layoutParagraph(runs, { maxWidth: width, measure, sizes, align });
  return {
    lines: lines.map(() => lineHeight),
    spaceBefore,
    keepWithNext,
    draw(y, from, to) {
      for (let i = from; i < to; i++) {
        const top = y + (i - from) * lineHeight;
        const baseline = baselineFor(top, lineHeight, sizes.ml);
        if (i === 0 && marker?.bullet) {
          doc.setFillColor(0, 0, 0);
          doc.circle(marker.x + BULLET_RADIUS, baseline - 4, BULLET_RADIUS, "F");
        } else if (i === 0 && marker) {
          setFont(doc, marker.script, false, false, marker.size);
          doc.setTextColor(0, 0, 0);
          doc.text(marker.text, marker.x, baseline, { baseline: "alphabetic" });
        }
        drawLine(doc, lines[i], x, baseline);
      }
    },
  };
}

function headerBlock(doc, header, logo) {
  const LOGO = { x: MARGIN.left - 22, y: MARGIN.top - 8, size: 104 };
  const hasLogo = Boolean(logo);
  // Header text is centred in the space to the right of the logo.
  const textLeft = hasLogo ? LOGO.x + LOGO.size + 10 : MARGIN.left;
  const centerX = (textLeft + CONTENT_RIGHT) / 2;
  const height = 108;

  return {
    lines: [height],
    spaceBefore: 0,
    keepWithNext: true,
    draw(y) {
      if (hasLogo) drawLogo(doc, logo, LOGO.x, y + LOGO.y - MARGIN.top, LOGO.size);

      const rows = [
        { text: header.churchName, style: "bold", size: 15.5, color: HEADER_COLOR.name, dy: 30 },
        { text: header.subtitle, style: "bold", size: 14, color: HEADER_COLOR.sub, dy: 21 },
        { text: header.addressLine1, style: "normal", size: 12.5, color: HEADER_COLOR.text, dy: 20 },
        { text: header.addressLine2, style: "normal", size: 12.5, color: HEADER_COLOR.text, dy: 19 },
      ];
      let baseline = y;
      for (const row of rows) {
        baseline += row.dy;
        if (!row.text) continue;
        doc.setFont(LATIN_FONT, row.style);
        doc.setFontSize(row.size);
        doc.setTextColor(...row.color);
        doc.text(row.text, centerX, baseline, { align: "center", baseline: "alphabetic" });
      }
      doc.setTextColor(0, 0, 0);
    },
  };
}

function signatureBlock(doc, signature, measure) {
  const width = 210;
  const x = CONTENT_RIGHT - width - 20;
  const runs = [{ text: `${signature.name}\n${signature.title}`, bold: false, italic: false, underline: false }];
  const lines = layoutParagraph(runs, { maxWidth: width, measure, sizes: BODY, align: "center" });
  const lineHeight = BODY_LINE + 6;
  return {
    lines: lines.map(() => lineHeight),
    spaceBefore: 34,
    keepWithNext: false,
    draw(y, from, to) {
      for (let i = from; i < to; i++) {
        drawLine(doc, lines[i], x, baselineFor(y + (i - from) * lineHeight, lineHeight, BODY.ml));
      }
    },
  };
}

// ── Drawing primitives ──────────────────────────────────────────────────────

function baselineFor(top, lineHeight, mlSize) {
  // Centre the Malayalam font's body (ascent .65em + descent .30em) in the line.
  return top + (lineHeight - 0.95 * mlSize) / 2 + 0.65 * mlSize;
}

function setFont(doc, script, bold, italic, size) {
  if (script === "ml") doc.setFont(ML_FONT, "normal");
  else doc.setFont(LATIN_FONT, latinStyle(bold, italic));
  doc.setFontSize(size);
}

function drawLine(doc, line, x, baseline) {
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  for (const frag of line.fragments) {
    setFont(doc, frag.script, frag.bold, frag.italic, frag.size);
    const opts = { baseline: "alphabetic" };
    if (frag.script === "ml") {
      // The Malayalam font has no bold/italic faces: simulate them.
      if (frag.bold) {
        doc.setLineWidth(frag.size * FAUX_BOLD_EM);
        opts.renderingMode = "fillThenStroke";
      }
      if (frag.italic) opts.angle = new doc.Matrix(1, 0, ITALIC_SHEAR, 1, 0, 0);
    }
    // jsPDF applies the shear to the text position too (in PDF space, where y
    // grows upwards from the page bottom), so shift x back by that amount.
    const shift = opts.angle ? ITALIC_SHEAR * (doc.internal.pageSize.getHeight() - baseline) : 0;
    doc.text(frag.text, x + frag.x - shift, baseline, opts);
  }
  if (line.underlines.length) {
    doc.setLineWidth(UNDERLINE.width);
    for (const u of line.underlines) {
      doc.line(x + u.x1, baseline + UNDERLINE.offset, x + u.x2, baseline + UNDERLINE.offset);
    }
  }
}

/**
 * Draws the logo whole (no cropping), scaled to fit a size × size box and
 * centred in it. Transparent areas stay transparent.
 */
function drawLogo(doc, logo, x, y, size) {
  const scale = size / Math.max(logo.width, logo.height);
  const w = logo.width * scale;
  const h = logo.height * scale;
  const format =
    typeof logo.data === "string" && /^data:image\/jpe?g/i.test(logo.data) ? "JPEG" : "PNG";
  doc.addImage(logo.data, format, x + (size - w) / 2, y + (size - h) / 2, w, h, undefined, "SLOW");
}

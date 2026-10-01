/**
 * render-sample.mjs
 *
 * Dev helper: renders the built-in sample notice (27.09.2026) to a PDF with
 * the same builder the app uses, to check the layout without a browser.
 *
 * Usage: node tools/render-sample.mjs [out.pdf] [logo.png|jpg]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildAriyippuPdf } from "../src/lib/pdf/buildAriyippuPdf.js";
import { FONT_FILES } from "../src/lib/pdf/fonts.js";
import { sampleNotice } from "../src/data/notice.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [out = "sample.pdf", logo] = process.argv.slice(2);

const fontBytes = Object.fromEntries(
  Object.entries(FONT_FILES).map(([key, file]) => [key, new Uint8Array(readFileSync(join(root, "src/assets/fonts", file)))]),
);

const notice = sampleNotice();
if (logo) {
  const mime = extname(logo).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
  notice.header.logoDataUrl = `data:${mime};base64,${readFileSync(logo).toString("base64")}`;
}

const { doc, pageCount, oversizedItemIds } = buildAriyippuPdf(notice, fontBytes);
writeFileSync(out, Buffer.from(doc.output("arraybuffer")));
console.log(`wrote ${out}: ${pageCount} page(s), oversized items: ${oversizedItemIds.length}`);

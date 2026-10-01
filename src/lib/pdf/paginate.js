/**
 * paginate.js
 *
 * Places blocks (header, title, headings, items, signature) on pages so that
 * no block is split across a page break. Pure — no jsPDF.
 *
 * Rules:
 *  - A block that does not fit in the remaining space moves to the next page.
 *  - spaceBefore is dropped at the top of a page.
 *  - keepWithNext keeps a block (e.g. a section heading) on the same page as
 *    the block after it.
 *  - Only a block taller than a whole page is split, at line boundaries; it
 *    is reported in `oversized` so the UI can warn about it.
 */

/**
 * @typedef {{ lines: number[], spaceBefore?: number, keepWithNext?: boolean }} Block
 * @typedef {{ block: number, page: number, y: number, fromLine: number, toLine: number }} Placement
 */

/**
 * @param {Block[]} blocks
 * @param {{ top: number, bottom: number }} area   usable y range on every page
 * @returns {{ placements: Placement[], pageCount: number, oversized: number[] }}
 */
export function paginate(blocks, { top, bottom }) {
  const usable = bottom - top;
  const heightOf = (b) => b.lines.reduce((sum, h) => sum + h, 0);

  const placements = [];
  const oversized = [];
  let page = 0;
  let y = top;

  const newPage = () => {
    page += 1;
    y = top;
  };

  blocks.forEach((block, index) => {
    const height = heightOf(block);
    let spaceBefore = y === top ? 0 : block.spaceBefore ?? 0;

    // Height that must fit together: this block plus, for keepWithNext,
    // the next block (capped to one page so an oversized one can't loop).
    let needed = spaceBefore + height;
    const next = blocks[index + 1];
    if (block.keepWithNext && next) {
      needed += (next.spaceBefore ?? 0) + Math.min(heightOf(next), usable);
    }

    if (y + needed > bottom && y > top && needed <= usable) {
      newPage();
      spaceBefore = 0;
    } else if (y + spaceBefore + height > bottom && y > top && height <= usable) {
      // Together with the next block it is too tall for any page; at least
      // keep this block whole.
      newPage();
      spaceBefore = 0;
    }

    y += spaceBefore;

    if (y + height <= bottom) {
      placements.push({ block: index, page, y, fromLine: 0, toLine: block.lines.length });
      y += height;
      return;
    }

    // Taller than a page: split at line boundaries.
    oversized.push(index);
    let from = 0;
    while (from < block.lines.length) {
      let to = from;
      let h = 0;
      while (to < block.lines.length && (y + h + block.lines[to] <= bottom || to === from && y === top)) {
        h += block.lines[to];
        to += 1;
      }
      if (to === from) {
        newPage();
        continue;
      }
      placements.push({ block: index, page, y, fromLine: from, toLine: to });
      y += h;
      from = to;
      if (from < block.lines.length) newPage();
    }
  });

  return { placements, pageCount: page + 1, oversized };
}

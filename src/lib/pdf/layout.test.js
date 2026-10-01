import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { layoutParagraph } from "./layoutParagraph.js";
import { paginate } from "./paginate.js";

// Every character is 1pt wide at size 1, so widths are easy to reason about.
const measure = (text, _font, size) => [...text].length * size;
const sizes = { ml: 1, latin: 1 };
const run = (text, marks = {}) => ({ text, bold: false, italic: false, underline: false, ...marks });

describe("layoutParagraph", () => {
  it("wraps at spaces within maxWidth", () => {
    const lines = layoutParagraph([run("aaa bbb ccc")], { maxWidth: 7, measure, sizes });
    assert.equal(lines.length, 2);
    assert.deepEqual(lines[0].fragments.map((f) => f.text), ["aaa", "bbb"]);
    assert.deepEqual(lines[1].fragments.map((f) => f.text), ["ccc"]);
  });

  it("justifies all lines except the last", () => {
    const lines = layoutParagraph([run("aa bb cccccc")], { maxWidth: 8, measure, sizes });
    assert.equal(lines[0].width, 8);
    assert.equal(lines[0].fragments[1].x, 6); // "bb" pushed to the right edge
    assert.equal(lines[1].fragments[0].x, 0);
  });

  it("does not justify a line ended by a forced break", () => {
    const lines = layoutParagraph([run("aa bb\ncc dd ee ff")], { maxWidth: 20, measure, sizes });
    assert.equal(lines.length, 2);
    assert.equal(lines[0].fragments[1].x, 3);
  });

  it("converts Malayalam fragments to ML-TT and splits scripts inside a word", () => {
    const lines = layoutParagraph([run("യൂണിറ്റ്50")], { maxWidth: 100, measure, sizes });
    const frags = lines[0].fragments;
    assert.equal(frags.length, 2);
    assert.equal(frags[0].script, "ml");
    assert.equal(frags[1].text, "50");
    assert.equal(frags[1].script, "latin");
  });

  it("keeps formatting per fragment and merges underlines across spaces", () => {
    const lines = layoutParagraph([run("ab cd", { underline: true }), run(" ef")], {
      maxWidth: 100,
      measure,
      sizes,
    });
    assert.deepEqual(lines[0].underlines, [{ x1: 0, x2: 5 }]);
  });

  it("centres when asked", () => {
    const lines = layoutParagraph([run("ab")], { maxWidth: 10, measure, sizes, align: "center" });
    assert.equal(lines[0].fragments[0].x, 4);
  });
});

describe("paginate", () => {
  const area = { top: 0, bottom: 100 };
  const block = (n, extra = {}) => ({ lines: Array(n).fill(10), spaceBefore: 5, ...extra });

  it("never splits a block that fits on a page", () => {
    const { placements, pageCount } = paginate([block(6), block(5)], area);
    assert.equal(pageCount, 2);
    assert.deepEqual(
      placements.map((p) => [p.block, p.page, p.y, p.fromLine, p.toLine]),
      [
        [0, 0, 0, 0, 6],
        [1, 1, 0, 0, 5],
      ],
    );
  });

  it("keeps a heading with the block after it", () => {
    const { placements } = paginate([block(8), block(1, { keepWithNext: true }), block(3)], area);
    assert.equal(placements[1].page, 1);
    assert.equal(placements[2].page, 1);
  });

  it("splits only blocks taller than a page and reports them", () => {
    const { placements, oversized } = paginate([block(2), block(15)], area);
    assert.deepEqual(oversized, [1]);
    const parts = placements.filter((p) => p.block === 1);
    assert.ok(parts.length >= 2);
    assert.equal(parts.reduce((n, p) => n + p.toLine - p.fromLine, 0), 15);
  });

  it("drops spaceBefore at the top of a page", () => {
    const { placements } = paginate([block(9), block(2)], area);
    assert.equal(placements[1].y, 0);
  });
});

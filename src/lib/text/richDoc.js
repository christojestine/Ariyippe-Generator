/**
 * richDoc.js
 *
 * Helpers for the TipTap JSON documents ("RichDoc") stored for every item.
 *
 * A run is a piece of text with uniform formatting:
 *   { text: string, bold: boolean, italic: boolean, underline: boolean }
 * Paragraphs and hard breaks inside an item become "\n" inside run text.
 */

/**
 * @param {string} text  plain text; "\n" starts a new paragraph
 * @param {{ bold?: boolean, italic?: boolean, underline?: boolean }} [marks]
 */
export function docFromText(text, marks = {}) {
  const markList = ["bold", "italic", "underline"].filter((m) => marks[m]).map((type) => ({ type }));
  return {
    type: "doc",
    content: text.split("\n").map((line) => ({
      type: "paragraph",
      content: line
        ? [{ type: "text", text: line, ...(markList.length ? { marks: markList } : {}) }]
        : [],
    })),
  };
}

/**
 * Flattens a RichDoc into formatted runs, merging neighbours with equal marks.
 *
 * @param {object | null | undefined} doc
 * @returns {Array<{ text: string, bold: boolean, italic: boolean, underline: boolean }>}
 */
export function richDocToRuns(doc) {
  const runs = [];
  const push = (text, marks) => {
    if (!text) return;
    const run = {
      text,
      bold: marks.has("bold"),
      italic: marks.has("italic"),
      underline: marks.has("underline"),
    };
    const last = runs[runs.length - 1];
    if (last && last.bold === run.bold && last.italic === run.italic && last.underline === run.underline) {
      last.text += text;
    } else {
      runs.push(run);
    }
  };

  const paragraphs = doc?.content ?? [];
  paragraphs.forEach((para, i) => {
    if (i > 0) push("\n", new Set());
    for (const node of para.content ?? []) {
      if (node.type === "text") {
        push(node.text, new Set((node.marks ?? []).map((m) => m.type)));
      } else if (node.type === "hardBreak") {
        push("\n", new Set());
      }
    }
  });

  // Drop trailing empty paragraphs/whitespace.
  while (runs.length && !runs[runs.length - 1].text.trim()) runs.pop();
  if (runs.length) runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, "");
  return runs;
}

/** Plain text of a RichDoc. */
export function richDocToText(doc) {
  return richDocToRuns(doc).map((r) => r.text).join("");
}

/** True when the RichDoc contains no visible text. */
export function isRichDocEmpty(doc) {
  return richDocToText(doc).trim() === "";
}

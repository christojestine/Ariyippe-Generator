/**
 * inputModesExtension.js
 *
 * TipTap extension implementing the editor's input modes:
 *
 *  - "english":  text is typed as-is.
 *  - "manglish": when a word boundary (space, punctuation, digit, Enter) is
 *                typed, the Latin word before the cursor is transliterated to
 *                Malayalam. Backspace right after a conversion restores the
 *                Latin word, so English words can be typed in this mode too.
 *  - "inscript": physical keys are mapped to the Malayalam Inscript layout.
 *
 * Malayalam typed with an OS keyboard / IME or pasted always passes through
 * unchanged, in every mode.
 *
 * Mod-m cycles the mode; the mode itself lives in the app store and is read
 * through the getMode / cycleMode options.
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { manglishToMalayalam, transliterateWord } from "../translit/manglish.js";
import { inscriptCharFor } from "../translit/inscript.js";

const pluginKey = new PluginKey("inputModes");
const MANGLISH_WORD_BEFORE_CURSOR = /[A-Za-z~_^]+$/;
const MANGLISH_CHAR = /^[A-Za-z~_^]$/;

/**
 * Transliterates the Manglish word that ends at the cursor and inserts
 * `boundary` after it. Returns false when there is nothing to convert.
 */
function convertWordBeforeCursor(view, boundary) {
  const { state } = view;
  const { $from, from, to } = state.selection;
  if (from !== to) return false;

  const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, "￼");
  const match = MANGLISH_WORD_BEFORE_CURSOR.exec(textBefore);
  if (!match) return false;

  const word = match[0];
  const malayalam = transliterateWord(word);
  const start = from - word.length;
  // The word keeps its own formatting; the boundary gets what the user has
  // toggled for the next character (e.g. bold switched off after the word).
  const wordMarks = state.doc.nodeAt(start)?.marks ?? [];
  const nextMarks = state.storedMarks ?? $from.marks();
  const tr = state.tr.replaceWith(start, to, state.schema.text(malayalam, wordMarks));
  if (boundary) tr.insert(start + malayalam.length, state.schema.text(boundary, nextMarks));
  if (state.storedMarks) tr.setStoredMarks(state.storedMarks);
  tr.setMeta(pluginKey, {
    start,
    end: start + malayalam.length + boundary.length,
    original: word + boundary,
  });
  view.dispatch(tr);
  return true;
}

export const InputModes = Extension.create({
  name: "inputModes",

  addOptions() {
    return {
      getMode: () => "english",
      cycleMode: () => {},
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-m": () => {
        this.options.cycleMode();
        return true;
      },
    };
  },

  addCommands() {
    return {
      /** Transliterates the selected Manglish text, keeping formatting. */
      convertManglishSelection:
        () =>
        ({ state, dispatch }) => {
          const { from, to } = state.selection;
          if (from === to) return false;
          const edits = [];
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!node.isText) return;
            const a = Math.max(from, pos);
            const b = Math.min(to, pos + node.nodeSize);
            const text = node.text.slice(a - pos, b - pos);
            const converted = manglishToMalayalam(text);
            if (converted !== text) edits.push({ a, b, converted, marks: node.marks });
          });
          if (!edits.length) return false;
          if (dispatch) {
            const tr = state.tr;
            for (const { a, b, converted, marks } of edits.reverse()) {
              tr.replaceWith(a, b, state.schema.text(converted, marks));
            }
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const { getMode } = this.options;

    return [
      new Plugin({
        key: pluginKey,
        // Remembers the last Manglish conversion so Backspace can undo it.
        state: {
          init: () => null,
          apply(tr, last) {
            const meta = tr.getMeta(pluginKey);
            if (meta !== undefined) return meta;
            return tr.docChanged || tr.selectionSet ? null : last;
          },
        },
        props: {
          handleTextInput(view, _from, _to, text) {
            if (getMode() !== "manglish") return false;
            if (text.length !== 1 || MANGLISH_CHAR.test(text)) return false;
            return convertWordBeforeCursor(view, text);
          },

          handleKeyDown(view, event) {
            const mode = getMode();
            if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return false;

            if (mode === "inscript") {
              const ch = inscriptCharFor(event.code, event.shiftKey);
              if (!ch) return false;
              view.dispatch(view.state.tr.insertText(ch));
              return true;
            }

            if (mode === "manglish") {
              if (event.key === "Backspace") {
                const last = pluginKey.getState(view.state);
                const { from, to } = view.state.selection;
                if (last && from === to && from === last.end) {
                  const tr = view.state.tr.insertText(last.original, last.start, last.end);
                  tr.setMeta(pluginKey, null);
                  view.dispatch(tr);
                  return true;
                }
                return false;
              }
              if (event.key === "Enter" || event.key === "Tab") {
                // Convert the last word, then let Enter / Tab do their usual job.
                convertWordBeforeCursor(view, "");
                return false;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});

/**
 * Converts a trailing Manglish word that has no boundary after it yet
 * (e.g. before saving an item). No-op outside Manglish mode.
 *
 * @param {import("@tiptap/core").Editor} editor
 */
export function flushManglish(editor) {
  const ext = editor.extensionManager.extensions.find((e) => e.name === "inputModes");
  if (!ext || ext.options.getMode() !== "manglish") return;
  // Only the word being typed at the very end of the text.
  const { selection, doc } = editor.view.state;
  if (selection.empty && selection.$from.parentOffset === selection.$from.parent.content.size &&
      selection.$from.end() === doc.content.size - 1) {
    convertWordBeforeCursor(editor.view, "");
  }
}

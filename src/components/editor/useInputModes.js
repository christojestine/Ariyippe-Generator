/**
 * useInputModes — the editor's input modes for plain single-line inputs
 * (titles, names, short header text). Mirrors lib/editor/inputModesExtension.js:
 *
 *  - "english":  text is typed as-is.
 *  - "manglish": the Latin word before the caret is transliterated when a word
 *                boundary is typed; Backspace right after restores the Latin
 *                word. A trailing word is converted when the field loses focus.
 *  - "inscript": physical keys are mapped to the Malayalam Inscript layout.
 *
 * Ctrl+M cycles the mode. Returns props to spread onto a controlled <input>.
 */

import { useLayoutEffect, useRef } from "react";
import { transliterateWord } from "../../lib/translit/manglish.js";
import { inscriptCharFor } from "../../lib/translit/inscript.js";
import { useAriyippuStore } from "../../store/useAriyippuStore.js";

const MANGLISH_WORD_BEFORE_CURSOR = /[A-Za-z~_^]+$/;
const MANGLISH_CHAR = /^[A-Za-z~_^]$/;

export function useInputModes(value, onChange) {
  const inputRef = useRef(null);
  const pendingCaret = useRef(null);
  // Last Manglish conversion, so Backspace can undo it.
  const lastConversion = useRef(null);

  useLayoutEffect(() => {
    if (pendingCaret.current == null || !inputRef.current) return;
    if (document.activeElement === inputRef.current) {
      inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
    }
    pendingCaret.current = null;
  }, [value]);

  const apply = (next, caret) => {
    pendingCaret.current = caret;
    onChange(next);
  };

  /** Converts the Manglish word ending at `caret`, then inserts `boundary`. */
  const convertWordBefore = (text, caret, boundary) => {
    const match = MANGLISH_WORD_BEFORE_CURSOR.exec(text.slice(0, caret));
    if (!match) return false;
    const word = match[0];
    const start = caret - word.length;
    const malayalam = transliterateWord(word) + boundary;
    const next = text.slice(0, start) + malayalam + text.slice(caret);
    const end = start + malayalam.length;
    lastConversion.current = { start, end, original: word + boundary, value: next };
    apply(next, end);
    return true;
  };

  const onKeyDown = (e) => {
    const el = e.currentTarget;
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "m") {
      e.preventDefault();
      useAriyippuStore.getState().cycleInputMode();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || e.nativeEvent.isComposing) return;

    const mode = useAriyippuStore.getState().inputMode;
    const { selectionStart: from, selectionEnd: to } = el;
    const text = el.value;

    if (mode === "inscript") {
      const ch = inscriptCharFor(e.code, e.shiftKey);
      if (!ch) return;
      e.preventDefault();
      apply(text.slice(0, from) + ch + text.slice(to), from + ch.length);
      return;
    }

    if (mode !== "manglish" || from !== to) return;

    if (e.key === "Backspace") {
      const last = lastConversion.current;
      if (last && last.value === text && from === last.end) {
        e.preventDefault();
        lastConversion.current = null;
        apply(text.slice(0, last.start) + last.original + text.slice(last.end), last.start + last.original.length);
      }
      return;
    }
    if (e.key === "Enter") {
      convertWordBefore(text, from, "");
      return;
    }
    if (e.key.length === 1 && !MANGLISH_CHAR.test(e.key) && convertWordBefore(text, from, e.key)) {
      e.preventDefault();
    }
  };

  const onBlur = (e) => {
    if (useAriyippuStore.getState().inputMode !== "manglish") return;
    const { selectionStart: from, selectionEnd: to, value: text } = e.currentTarget;
    if (from === to && from === text.length) convertWordBefore(text, from, "");
  };

  return { ref: inputRef, onKeyDown, onBlur };
}

/**
 * RichTextEditor — the one text editor used for items and headings.
 *
 * Supports bold / italic / underline and every input method: Manglish
 * (live transliteration), English, Inscript, and Malayalam from the OS
 * keyboard or clipboard (see lib/editor/inputModesExtension.js).
 *
 * Parents control it through `ref`: getDoc(), clear(), focus().
 * getDoc() first converts a trailing Manglish word that has no space after it.
 */

import { useImperativeHandle, useRef } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { InputModes, flushManglish } from "../../lib/editor/inputModesExtension.js";
import { useAriyippuStore } from "../../store/useAriyippuStore.js";
import { IconButton } from "../common/Button.jsx";
import { InputModeToggle } from "./InputModeToggle.jsx";

export function RichTextEditor({ ref, initialContent, placeholder, onSubmit, onCancel, autoFocus = false, compact = false }) {
  // The editor is created once, so callbacks are read through refs.
  const callbacks = useRef({ onSubmit, onCancel });
  callbacks.current = { onSubmit, onCancel };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: false,
      }),
      Placeholder.configure({ placeholder }),
      InputModes.configure({
        getMode: () => useAriyippuStore.getState().inputMode,
        cycleMode: () => useAriyippuStore.getState().cycleInputMode(),
      }),
    ],
    content: initialContent ?? "",
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: { class: "editor-content ml-text", spellcheck: "false" },
      handleKeyDown: (_view, event) => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          callbacks.current.onSubmit?.();
          return true;
        }
        if (event.key === "Escape" && callbacks.current.onCancel) {
          callbacks.current.onCancel();
          return true;
        }
        return false;
      },
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      getDoc() {
        flushManglish(editor);
        return editor.getJSON();
      },
      clear() {
        editor.commands.clearContent(true);
        editor.commands.focus();
      },
      focus() {
        editor.commands.focus("end");
      },
    }),
    [editor],
  );

  const marks = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      hasSelection: !e.state.selection.empty,
    }),
  });

  return (
    <div className={`editor ${compact ? "editor-compact" : ""}`}>
      <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
        <IconButton label="Bold (Ctrl+B)" pressed={marks.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <b>B</b>
        </IconButton>
        <IconButton label="Italic (Ctrl+I)" pressed={marks.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <i>I</i>
        </IconButton>
        <IconButton
          label="Underline (Ctrl+U)"
          pressed={marks.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <u>U</u>
        </IconButton>
        <span className="toolbar-sep" />
        <IconButton
          label="Convert selected Manglish to Malayalam"
          disabled={!marks.hasSelection}
          onClick={() => editor.chain().focus().convertManglishSelection().run()}
        >
          a→അ
        </IconButton>
        <span className="toolbar-spacer" />
        {!compact && <InputModeToggle size="sm" />}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

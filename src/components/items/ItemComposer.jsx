import { useRef, useState } from "react";
import { isRichDocEmpty } from "../../lib/text/richDoc.js";
import { Button } from "../common/Button.jsx";
import { RichTextEditor } from "../editor/RichTextEditor.jsx";
import { Icon } from "../common/Icon.jsx";

/** Editor + Add button that appends a new item to a section. */
export function ItemComposer({ onAdd, placeholder }) {
  const editorRef = useRef(null);
  const [error, setError] = useState(false);

  const add = () => {
    const doc = editorRef.current.getDoc();
    if (isRichDocEmpty(doc)) {
      setError(true);
      editorRef.current.focus();
      return;
    }
    onAdd(doc);
    setError(false);
    editorRef.current.clear();
  };

  return (
    <div className={`composer ${error ? "has-error" : ""}`}>
      <RichTextEditor ref={editorRef} placeholder={placeholder} onSubmit={add} />
      <div className="composer-actions">
        <span className={error ? "hint hint-error" : "hint"}>
          {error ? "Type something first." : "Ctrl+Enter to add"}
        </span>
        <Button variant="primary" onClick={add}>
          <Icon name="plus" /> Add item
        </Button>
      </div>
    </div>
  );
}

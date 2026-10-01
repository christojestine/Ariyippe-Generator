import { useRef, useState } from "react";
import { isRichDocEmpty } from "../../lib/text/richDoc.js";
import { Button, IconButton } from "../common/Button.jsx";
import { RichContent } from "../common/RichContent.jsx";
import { RichTextEditor } from "../editor/RichTextEditor.jsx";
import { Icon } from "../common/Icon.jsx";

/**
 * One item in a section's stack: marker (number / bullet), content, and
 * move / edit / delete actions. Edits happen inline.
 */
export function ItemCard({ marker, item, isFirst, isLast, oversized, onSave, onRemove, onMove }) {
  const [editing, setEditing] = useState(false);
  const editorRef = useRef(null);

  const save = () => {
    const doc = editorRef.current.getDoc();
    if (isRichDocEmpty(doc)) return;
    onSave(doc);
    setEditing(false);
  };

  return (
    <li className={`item-card ${editing ? "is-editing" : ""} ${oversized ? "is-oversized" : ""}`}>
      <span className="item-marker" aria-hidden="true">
        {marker}
      </span>
      <div className="item-main">
        {editing ? (
          <>
            <RichTextEditor ref={editorRef} initialContent={item.content} autoFocus onSubmit={save} onCancel={() => setEditing(false)} />
            <div className="item-edit-actions">
              <span className="hint">Ctrl+Enter to save · Esc to cancel</span>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={save}>
                Save
              </Button>
            </div>
          </>
        ) : (
          <>
            <RichContent doc={item.content} className="ml-text" />
            {oversized && (
              <p className="item-warning" role="status">
                This item is taller than a whole page, so it had to be split across pages. Consider breaking it into
                two items.
              </p>
            )}
          </>
        )}
      </div>
      {!editing && (
        <div className="item-actions">
          <IconButton label="Move up" disabled={isFirst} onClick={() => onMove(-1)}>
            <Icon name="up" />
          </IconButton>
          <IconButton label="Move down" disabled={isLast} onClick={() => onMove(1)}>
            <Icon name="down" />
          </IconButton>
          <IconButton label="Edit" onClick={() => setEditing(true)}>
            <Icon name="edit" />
          </IconButton>
          <IconButton label="Delete" variant="danger" onClick={onRemove}>
            <Icon name="trash" />
          </IconButton>
        </div>
      )}
    </li>
  );
}

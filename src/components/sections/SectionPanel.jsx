import { useRef, useState } from "react";
import { SECTION_KIND_LABELS } from "../../data/notice.js";
import { isRichDocEmpty } from "../../lib/text/richDoc.js";
import { useAriyippuStore } from "../../store/useAriyippuStore.js";
import { Button, IconButton } from "../common/Button.jsx";
import { RichContent } from "../common/RichContent.jsx";
import { SelectField } from "../common/TextField.jsx";
import { RichTextEditor } from "../editor/RichTextEditor.jsx";
import { ItemComposer } from "../items/ItemComposer.jsx";
import { ItemStack } from "../items/ItemStack.jsx";
import { Icon } from "../common/Icon.jsx";

const KIND_OPTIONS = Object.entries(SECTION_KIND_LABELS).map(([value, label]) => ({ value, label }));

/** One section of the notice: optional heading, list style, and its items. */
export function SectionPanel({ section, index, count }) {
  const updateSection = useAriyippuStore((s) => s.updateSection);
  const removeSection = useAriyippuStore((s) => s.removeSection);
  const moveSection = useAriyippuStore((s) => s.moveSection);
  const addItem = useAriyippuStore((s) => s.addItem);

  const [editingHeading, setEditingHeading] = useState(false);
  const headingRef = useRef(null);
  const hasHeading = section.heading && !isRichDocEmpty(section.heading);

  const saveHeading = () => {
    const doc = headingRef.current.getDoc();
    updateSection(section.id, { heading: isRichDocEmpty(doc) ? null : doc });
    setEditingHeading(false);
  };

  const remove = () => {
    if (section.items.length && !window.confirm("Delete this section and all its items?")) return;
    removeSection(section.id);
  };

  return (
    <section className="card section-panel" aria-label={`Section ${index + 1}`}>
      <header className="section-header">
        <div className="section-heading">
          {editingHeading ? (
            <div className="heading-editor">
              <RichTextEditor
                ref={headingRef}
                compact
                autoFocus
                initialContent={section.heading}
                placeholder="Section heading (leave empty for none)"
                onSubmit={saveHeading}
                onCancel={() => setEditingHeading(false)}
              />
              <div className="item-edit-actions">
                <Button variant="ghost" size="sm" onClick={() => setEditingHeading(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={saveHeading}>
                  Save heading
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" className="heading-display" onClick={() => setEditingHeading(true)}>
              {hasHeading ? (
                <RichContent doc={section.heading} className="ml-text" />
              ) : (
                <span className="heading-placeholder">
                  {index === 0 ? "Announcements" : `Section ${index + 1}`} · no heading
                </span>
              )}
              <span className="heading-edit-hint">
                <Icon name="edit" /> Edit heading
              </span>
            </button>
          )}
        </div>
        <div className="section-tools">
          <SelectField
            label="List style"
            className="field-inline"
            value={section.kind}
            options={KIND_OPTIONS}
            onChange={(kind) => updateSection(section.id, { kind })}
          />
          <IconButton label="Move section up" disabled={index === 0} onClick={() => moveSection(section.id, -1)}>
            <Icon name="up" />
          </IconButton>
          <IconButton label="Move section down" disabled={index === count - 1} onClick={() => moveSection(section.id, 1)}>
            <Icon name="down" />
          </IconButton>
          <IconButton label="Delete section" variant="danger" onClick={remove}>
            <Icon name="trash" />
          </IconButton>
        </div>
      </header>

      <ItemStack section={section} />
      <ItemComposer
        placeholder="Type a new item… (Manglish, English or Malayalam)"
        onAdd={(content) => addItem(section.id, content)}
      />
    </section>
  );
}

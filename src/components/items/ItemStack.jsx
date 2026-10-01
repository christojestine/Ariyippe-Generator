import { useAriyippuStore } from "../../store/useAriyippuStore.js";
import { ItemCard } from "./ItemCard.jsx";

/** Numbered / bulleted stack of a section's items. */
export function ItemStack({ section }) {
  const updateItem = useAriyippuStore((s) => s.updateItem);
  const removeItem = useAriyippuStore((s) => s.removeItem);
  const moveItem = useAriyippuStore((s) => s.moveItem);
  const oversizedItemIds = useAriyippuStore((s) => s.oversizedItemIds);

  if (!section.items.length) {
    return <p className="empty-state">No items yet. Type one below and press Add.</p>;
  }

  return (
    <ol className="item-stack">
      {section.items.map((item, i) => (
        <ItemCard
          key={item.id}
          item={item}
          marker={section.kind === "numbered" ? `${i + 1}` : section.kind === "bulleted" ? "•" : "–"}
          isFirst={i === 0}
          isLast={i === section.items.length - 1}
          oversized={oversizedItemIds.includes(item.id)}
          onSave={(content) => updateItem(section.id, item.id, content)}
          onRemove={() => removeItem(section.id, item.id)}
          onMove={(delta) => moveItem(section.id, item.id, delta)}
        />
      ))}
    </ol>
  );
}

import { useEffect, useRef, useState } from "react";
import { useAriyippuStore } from "../../store/useAriyippuStore.js";
import { ItemCard } from "./ItemCard.jsx";

/** Pointer travel (px) before a mouse press turns into a drag. */
const DRAG_THRESHOLD = 6;
/** Hold time (ms) before a touch press turns into a drag, so a swipe still scrolls. */
const LONG_PRESS_MS = 350;
/** Elements inside a card that keep their own pointer behaviour. */
const NO_DRAG = "button, a, input, textarea, select, [contenteditable='true'], .item-actions";

/** Numbered / bulleted stack of a section's items. Cards can be dragged to reorder. */
export function ItemStack({ section }) {
  const updateItem = useAriyippuStore((s) => s.updateItem);
  const removeItem = useAriyippuStore((s) => s.removeItem);
  const moveItem = useAriyippuStore((s) => s.moveItem);
  const oversizedItemIds = useAriyippuStore((s) => s.oversizedItemIds);

  const listRef = useRef(null);
  const cleanupRef = useRef(null);
  // { from, to, dy, shift } while a card is being dragged.
  const [drag, setDrag] = useState(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  const beginPress = (e, index, itemId) => {
    if (e.button !== 0 || e.target.closest(NO_DRAG) || cleanupRef.current) return;
    const list = listRef.current;
    const isTouch = e.pointerType === "touch";
    const startY = e.clientY;
    const listTop0 = list.getBoundingClientRect().top;
    let lastY = startY;
    let geom = null; // card midpoints and the dragged card's slot size, captured when the drag starts
    let state = null;
    let timer = 0;

    const update = () => {
      // Compensate for scrolling during the drag by tracking the list's own movement.
      const dy = lastY - startY - (list.getBoundingClientRect().top - listTop0);
      const center = geom.mids[index] + dy;
      let to = index;
      geom.mids.forEach((mid, i) => {
        if (i < index && center < mid) to = Math.min(to, i);
        if (i > index && center > mid) to = Math.max(to, i);
      });
      state = { from: index, to, dy, shift: geom.shift };
      setDrag(state);
    };

    const start = () => {
      const rects = [...list.children].map((el) => el.getBoundingClientRect());
      const gap = rects.length > 1 ? rects[1].top - rects[0].bottom : 0;
      geom = {
        mids: rects.map((r) => r.top - listTop0 + r.height / 2),
        shift: rects[index].height + gap,
      };
      window.getSelection()?.removeAllRanges();
      update();
    };

    const finish = (commit) => {
      cleanup();
      if (commit && state && state.to !== state.from) moveItem(section.id, itemId, state.to - state.from);
      setDrag(null);
    };

    const onMove = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      lastY = ev.clientY;
      if (!geom) {
        const moved = Math.abs(ev.clientY - startY) > DRAG_THRESHOLD;
        if (isTouch) {
          if (moved) cleanup(); // a swipe: let the page scroll
        } else if (moved) {
          start();
        }
        return;
      }
      ev.preventDefault();
      update();
    };
    const onUp = (ev) => ev.pointerId === e.pointerId && finish(true);
    const onCancel = (ev) => ev.pointerId === e.pointerId && finish(false);
    const onKey = (ev) => ev.key === "Escape" && finish(false);
    const onScroll = () => geom && update();
    // Once a touch drag is live, stop the browser from scrolling instead.
    const onTouchMove = (ev) => geom && ev.cancelable && ev.preventDefault();
    const onContextMenu = (ev) => isTouch && ev.preventDefault();

    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("contextmenu", onContextMenu);
      cleanupRef.current = null;
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("contextmenu", onContextMenu);
    cleanupRef.current = cleanup;
    if (isTouch) timer = setTimeout(start, LONG_PRESS_MS);
  };

  const offsetFor = (i) => {
    if (!drag) return 0;
    if (i === drag.from) return drag.dy;
    if (drag.from < drag.to && i > drag.from && i <= drag.to) return -drag.shift;
    if (drag.to < drag.from && i >= drag.to && i < drag.from) return drag.shift;
    return 0;
  };

  if (!section.items.length) {
    return <p className="empty-state">No items yet. Type one below and press Add.</p>;
  }

  return (
    <ol ref={listRef} className={`item-stack ${drag ? "is-reordering" : ""}`}>
      {section.items.map((item, i) => (
        <ItemCard
          key={item.id}
          item={item}
          marker={section.kind === "numbered" ? `${i + 1}` : section.kind === "bulleted" ? "•" : "–"}
          isFirst={i === 0}
          isLast={i === section.items.length - 1}
          oversized={oversizedItemIds.includes(item.id)}
          dragging={drag?.from === i}
          offset={offsetFor(i)}
          onPressStart={(e) => beginPress(e, i, item.id)}
          onSave={(content) => updateItem(section.id, item.id, content)}
          onRemove={() => removeItem(section.id, item.id)}
          onMove={(delta) => moveItem(section.id, item.id, delta)}
        />
      ))}
    </ol>
  );
}

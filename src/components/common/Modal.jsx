import { useEffect, useRef } from "react";
import { Icon } from "./Icon.jsx";

/** Accessible modal dialog built on <dialog>. */
export function Modal({ open, title, onClose, footer, wide = false, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {open && (
        <>
          <header className="modal-header">
            <h2>{title}</h2>
            <button type="button" className="icon-btn icon-btn-ghost" aria-label="Close" onClick={onClose}>
              <Icon name="close" />
            </button>
          </header>
          <div className="modal-body">{children}</div>
          {footer && <footer className="modal-footer">{footer}</footer>}
        </>
      )}
    </dialog>
  );
}

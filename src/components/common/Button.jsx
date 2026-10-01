/**
 * Button / IconButton — the app's only button primitives.
 *
 * variant: "primary" | "secondary" | "ghost" | "danger"
 */
export function Button({ variant = "secondary", size = "md", className = "", type = "button", children, ...rest }) {
  return (
    <button type={type} className={`btn btn-${variant} btn-${size} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/**
 * Square button with an icon (or short text) and a required accessible label.
 * Pass `pressed` (true/false) to make it a toggle button.
 */
export function IconButton({ label, variant = "ghost", pressed, className = "", children, ...rest }) {
  return (
    <button
      type="button"
      className={`icon-btn icon-btn-${variant} ${pressed ? "is-active" : ""} ${className}`}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      {...rest}
    >
      {children}
    </button>
  );
}

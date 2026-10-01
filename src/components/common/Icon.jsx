/**
 * Inline SVG icons — used instead of emoji / symbol characters, which render
 * differently (or not at all) depending on the fonts installed on a machine.
 */

const PATHS = {
  up: "M12 19V5M5 12l7-7 7 7",
  down: "M12 5v14M19 12l-7 7-7-7",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  close: "M6 6l12 12M18 6L6 18",
  download: "M12 4v12M6 11l6 6 6-6M5 20h14",
  plus: "M12 5v14M5 12h14",
  help: "M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.5",
  printer: "M7 9V3h10v6M7 17H4v-7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v7h-3M7 14h10v7H7z",
  file: "M14 3H6v18h12V7l-4-4zM14 3v4h4M9 13h6M9 17h6",
  fileDown: "M14 3H6v18h12V7l-4-4zM14 3v4h4M12 11v6M9 14l3 3 3-3",
  plusCircle: "M12 8v8M8 12h8",
  brush: "M14 4l6 6-8 8H6v-6l8-8zM12 6l6 6",
  check: "M8 12.5l2.7 2.7L16 10",
  keyboard: "M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10",
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  refresh: "M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  sun: "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
};

/** Icons drawn with a centred circle of the given radius. */
const CIRCLES = { help: 9, plusCircle: 9, check: 9, sun: 4 };

export function Icon({ name, className = "" }) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "grip" ? 3 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {CIRCLES[name] && <circle cx="12" cy="12" r={CIRCLES[name]} />}
      <path d={PATHS[name]} />
    </svg>
  );
}

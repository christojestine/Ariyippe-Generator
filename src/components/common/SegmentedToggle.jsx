/**
 * A row of mutually exclusive options (radio group styled as segments).
 *
 * options: Array<{ value: string, label: string, hint?: string }>
 */
export function SegmentedToggle({ label, value, options, onChange, size = "md" }) {
  return (
    <div className={`segmented segmented-${size}`} role="radiogroup" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={value === opt.value ? "is-selected" : ""}
          title={opt.hint}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

import { useId } from "react";

/** Labelled single-line text input. */
export function TextField({ label, value, onChange, hint, className = "", ...rest }) {
  const id = useId();
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input id={id} className="field-input" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

/** Labelled select. options: Array<{ value, label }> */
export function SelectField({ label, value, onChange, options, className = "" }) {
  const id = useId();
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} className="field-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

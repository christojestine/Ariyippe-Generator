import { richDocToRuns } from "../../lib/text/richDoc.js";

/** Read-only rendering of a RichDoc (bold / italic / underline, line breaks). */
export function RichContent({ doc, className = "" }) {
  const runs = richDocToRuns(doc);
  return (
    <div className={`rich-content ${className}`}>
      {runs.map((run, i) => {
        const parts = run.text.split("\n");
        const style = {
          fontWeight: run.bold ? 700 : undefined,
          fontStyle: run.italic ? "italic" : undefined,
          textDecoration: run.underline ? "underline" : undefined,
        };
        return (
          <span key={i} style={style}>
            {parts.map((part, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {part}
              </span>
            ))}
          </span>
        );
      })}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { downloadUrl, generateNoticePdf, pdfFileName } from "../../lib/pdf/generateNoticePdf.js";
import { isRichDocEmpty } from "../../lib/text/richDoc.js";
import { useAriyippuStore } from "../../store/useAriyippuStore.js";
import { IconButton } from "../common/Button.jsx";
import { Icon } from "../common/Icon.jsx";

const REBUILD_DELAY = 700; // ms after the last edit

/**
 * Live print preview: the real PDF, rebuilt shortly after every edit, with
 * page / item counts and a quick download.
 */
export function PreviewPanel() {
  const notice = useAriyippuStore((s) => s.notice);
  const setOversizedItemIds = useAriyippuStore((s) => s.setOversizedItemIds);

  const [pdf, setPdf] = useState(null); // { url, pageCount, oversized }
  const [building, setBuilding] = useState(true);
  const [error, setError] = useState("");
  const buildId = useRef(0);

  useEffect(() => {
    setBuilding(true);
    const id = ++buildId.current;
    const timer = setTimeout(async () => {
      try {
        const { blob, pageCount, oversizedItemIds } = await generateNoticePdf(notice);
        if (id !== buildId.current) return; // a newer edit superseded this build
        setOversizedItemIds(oversizedItemIds);
        setPdf({ url: URL.createObjectURL(blob), pageCount, oversized: oversizedItemIds.length });
        setError("");
      } catch (err) {
        if (id !== buildId.current) return;
        console.error(err);
        setError(err.message || String(err));
      }
      setBuilding(false);
    }, REBUILD_DELAY);
    return () => clearTimeout(timer);
  }, [notice, setOversizedItemIds]);

  // Release the blob URL when it is replaced or the panel unmounts.
  useEffect(() => () => pdf && URL.revokeObjectURL(pdf.url), [pdf]);

  const sectionCount = notice.sections.filter((s) => s.items.some((it) => !isRichDocEmpty(it.content))).length;
  const itemCount = notice.sections.reduce((n, s) => n + s.items.filter((it) => !isRichDocEmpty(it.content)).length, 0);

  return (
    <aside className="preview" aria-label="Print preview">
      <div className="glass preview-bar">
        <div className="preview-title">
          <Icon name="file" className="preview-file-icon" />
          <span>Print preview</span>
          <span className="tag">A4{pdf ? ` · ${pdf.pageCount} page${pdf.pageCount > 1 ? "s" : ""}` : ""}</span>
        </div>
        <div className="preview-tools">
          <span className={`live-dot ${building ? "is-busy" : ""}`} aria-live="polite">
            {building ? "Updating…" : "Live"}
          </span>
          <IconButton
            label="Download PDF"
            variant="accent"
            disabled={!pdf}
            onClick={() => downloadUrl(pdf.url, pdfFileName(notice.noticeDate))}
          >
            <Icon name="download" />
          </IconButton>
        </div>
      </div>

      <div className="sheet-frame">
        {pdf ? (
          <iframe key={pdf.url} title="PDF preview" src={`${pdf.url}#toolbar=0&navpanes=0&view=FitH`} />
        ) : (
          <div className="sheet-placeholder">{error ? `Preview failed: ${error}` : "Preparing preview…"}</div>
        )}
      </div>

      <div className="glass preview-stats">
        <span>
          Sections <strong>{sectionCount}</strong>
        </span>
        <span>
          Items <strong>{itemCount}</strong>
        </span>
        <span>
          Pages <strong>{pdf?.pageCount ?? "–"}</strong>
        </span>
        {pdf &&
          (pdf.oversized ? (
            <span className="stat-warn">
              {pdf.oversized} item{pdf.oversized > 1 ? "s" : ""} split
            </span>
          ) : (
            <span className="stat-ok">
              <Icon name="check" /> No item split
            </span>
          ))}
      </div>
    </aside>
  );
}

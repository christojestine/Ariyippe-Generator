import { useEffect, useState } from "react";
import { isRichDocEmpty, richDocToText } from "../../lib/text/richDoc.js";
import { useAriyippuStore } from "../../store/useAriyippuStore.js";
import { Button } from "../common/Button.jsx";
import { Modal } from "../common/Modal.jsx";
import { Icon } from "../common/Icon.jsx";

/** "dd.mm.yyyy" → "yyyy-mm-dd" for the file name; otherwise a safe slug. */
function fileNameFor(noticeDate) {
  const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(noticeDate.trim());
  const stamp = m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : noticeDate.replace(/[^\w-]+/g, "-");
  return `ariyippu-${stamp || "notice"}.pdf`;
}

/**
 * Generate button + modal: review the items, confirm, preview the PDF,
 * download it.
 */
export function GeneratePanel() {
  const notice = useAriyippuStore((s) => s.notice);
  const setOversizedItemIds = useAriyippuStore((s) => s.setOversizedItemIds);

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("review"); // review | building | ready | error
  const [pdf, setPdf] = useState(null); // { url, pageCount, oversized }
  const [error, setError] = useState("");

  const sections = notice.sections.map((s) => ({
    ...s,
    filled: s.items.filter((it) => !isRichDocEmpty(it.content)),
  }));
  const itemCount = sections.reduce((n, s) => n + s.filled.length, 0);

  // Release the blob URL when it is replaced or the panel unmounts.
  useEffect(() => () => pdf && URL.revokeObjectURL(pdf.url), [pdf]);

  const openPanel = () => {
    setStatus("review");
    setPdf(null);
    setOpen(true);
  };

  const generate = async () => {
    setStatus("building");
    setError("");
    try {
      const [{ buildAriyippuPdf }, { loadFontBytes }, { resolveLogo }] = await Promise.all([
        import("../../lib/pdf/buildAriyippuPdf.js"),
        import("../../lib/pdf/loadFonts.js"),
        import("../../lib/pdf/loadLogo.js"),
      ]);
      const [fontBytes, logo] = await Promise.all([loadFontBytes(), resolveLogo(notice.header)]);
      const { doc, pageCount, oversizedItemIds } = buildAriyippuPdf(notice, fontBytes, { logo });
      setOversizedItemIds(oversizedItemIds);
      setPdf({ url: URL.createObjectURL(doc.output("blob")), pageCount, oversized: oversizedItemIds.length });
      setStatus("ready");
    } catch (err) {
      console.error(err);
      setError(err.message || String(err));
      setStatus("error");
    }
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = pdf.url;
    a.download = fileNameFor(notice.noticeDate);
    document.body.append(a);
    a.click();
    a.remove();
  };

  const footer =
    status === "ready" ? (
      <>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Back to editing
        </Button>
        <Button variant="secondary" onClick={() => setStatus("review")}>
          Review items
        </Button>
        <Button variant="primary" onClick={download}>
          <Icon name="download" /> Download PDF
        </Button>
      </>
    ) : (
      <>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={generate} disabled={!itemCount || status === "building"}>
          {status === "building" ? "Generating…" : "Confirm & generate PDF"}
        </Button>
      </>
    );

  return (
    <>
      <Button variant="primary" onClick={openPanel}>
        Generate PDF
      </Button>
      <Modal open={open} title={status === "ready" ? "Your Ariyippu" : "Confirm items"} onClose={() => setOpen(false)} footer={footer} wide={status === "ready"}>
        {status === "ready" && pdf ? (
          <div className="pdf-preview">
            <p className="hint">
              {pdf.pageCount} page{pdf.pageCount > 1 ? "s" : ""}. No item is split across pages
              {pdf.oversized ? ` (except ${pdf.oversized} item${pdf.oversized > 1 ? "s" : ""} taller than a page, marked in the editor)` : ""}.
              {" "}Preview empty?{" "}
              <a href={pdf.url} target="_blank" rel="noreferrer">
                Open in a new tab
              </a>
            </p>
            <iframe title="PDF preview" src={pdf.url} />
          </div>
        ) : (
          <div className="review">
            <p>
              <strong>{notice.header.title} {notice.noticeDate}</strong> — {itemCount} item{itemCount === 1 ? "" : "s"} in{" "}
              {sections.filter((s) => s.filled.length).length} section(s).
            </p>
            <ul className="review-list">
              {sections.map((s, i) => (
                <li key={s.id} className={s.filled.length ? "" : "is-empty"}>
                  <span className="ml-text">
                    {s.heading && !isRichDocEmpty(s.heading) ? richDocToText(s.heading) : i === 0 ? "Announcements" : `Section ${i + 1}`}
                  </span>
                  <span className="review-count">{s.filled.length ? `${s.filled.length} item(s)` : "empty — skipped"}</span>
                </li>
              ))}
            </ul>
            {!itemCount && <p className="hint hint-error">Add at least one item first.</p>}
            {status === "error" && <p className="hint hint-error">Could not generate the PDF: {error}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}

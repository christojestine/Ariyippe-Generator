import { useState } from "react";
import { DEFAULT_LOGO_URL } from "../../lib/pdf/loadLogo.js";
import { manglishToMalayalam } from "../../lib/translit/manglish.js";
import { useAriyippuStore } from "../../store/useAriyippuStore.js";
import { Button } from "../common/Button.jsx";
import { Card } from "../common/Card.jsx";
import { TextField } from "../common/TextField.jsx";

const LOGO_MAX = 500; // px — plenty for a ~1.4in printed logo, small enough for localStorage

/**
 * Downscales an image file to a PNG data URL, keeping its shape and
 * transparency (logos are printed whole, never cropped).
 */
function fileToLogoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, LOGO_MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Could not read the image"));
    img.src = URL.createObjectURL(file);
  });
}

/** Text field for Malayalam values with a Manglish → Malayalam button. */
function MalayalamField({ label, value, onChange }) {
  return (
    <div className="field-with-action">
      <TextField label={label} value={value} onChange={onChange} className="ml-text" />
      <Button size="sm" variant="ghost" title="Convert Manglish to Malayalam" onClick={() => onChange(manglishToMalayalam(value))}>
        a→അ
      </Button>
    </div>
  );
}

/** Church header, notice date, logo and signature. */
export function HeaderSettings() {
  const notice = useAriyippuStore((s) => s.notice);
  const setHeader = useAriyippuStore((s) => s.setHeader);
  const setNoticeDate = useAriyippuStore((s) => s.setNoticeDate);
  const setSignature = useAriyippuStore((s) => s.setSignature);
  const [open, setOpen] = useState(false);
  const [logoError, setLogoError] = useState("");
  const { header, signature } = notice;
  // Notices saved before logo modes existed have no logoMode (see loadLogo.js).
  const logoMode = header.logoMode ?? (header.logoDataUrl ? "custom" : "default");
  const logoSrc = logoMode === "default" ? DEFAULT_LOGO_URL : logoMode === "custom" ? header.logoDataUrl : "";

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setHeader({ logoMode: "custom", logoDataUrl: await fileToLogoDataUrl(file) });
      setLogoError("");
    } catch (err) {
      setLogoError(err.message);
    }
  };

  return (
    <Card
      title="Notice details"
      subtitle={`${header.title} ${notice.noticeDate} · ${header.churchName}`}
      actions={
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? "Hide" : "Edit header, logo & signature"}
        </Button>
      }
    >
      <div className="details-row">
        <TextField
          label="Notice date"
          value={notice.noticeDate}
          onChange={setNoticeDate}
          placeholder="27.09.2026"
          className="field-date"
        />
        <MalayalamField label="Title" value={header.title} onChange={(title) => setHeader({ title })} />
      </div>

      {open && (
        <div className="details-grid">
          <div className="logo-picker">
            <div className="logo-preview" aria-label="Logo preview">
              {logoSrc ? <img src={logoSrc} alt="Church logo" /> : <span>No logo</span>}
            </div>
            <p className="hint logo-caption">
              {logoMode === "default" ? "Default logo" : logoMode === "custom" ? "Your uploaded logo" : "No logo printed"}
            </p>
            <label className="btn btn-secondary btn-sm">
              Upload logo
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onLogo} hidden />
            </label>
            {logoMode !== "default" && (
              <Button size="sm" variant="ghost" onClick={() => setHeader({ logoMode: "default", logoDataUrl: "" })}>
                Use default logo
              </Button>
            )}
            {logoMode !== "none" && (
              <Button size="sm" variant="ghost" onClick={() => setHeader({ logoMode: "none", logoDataUrl: "" })}>
                No logo
              </Button>
            )}
            {logoError && <p className="hint hint-error">{logoError}</p>}
          </div>
          <div className="details-fields">
            <TextField label="Church name" value={header.churchName} onChange={(churchName) => setHeader({ churchName })} />
            <TextField label="Subtitle" value={header.subtitle} onChange={(subtitle) => setHeader({ subtitle })} />
            <TextField label="Address line 1" value={header.addressLine1} onChange={(addressLine1) => setHeader({ addressLine1 })} />
            <TextField label="Address line 2" value={header.addressLine2} onChange={(addressLine2) => setHeader({ addressLine2 })} />
            <MalayalamField label="Signature name" value={signature.name} onChange={(name) => setSignature({ name })} />
            <MalayalamField label="Signature title" value={signature.title} onChange={(title) => setSignature({ title })} />
          </div>
        </div>
      )}
    </Card>
  );
}

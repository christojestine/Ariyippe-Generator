import { useState } from "react";
import { manglishToMalayalam } from "../../lib/translit/manglish.js";
import { useAriyippuStore } from "../../store/useAriyippuStore.js";
import { Button } from "../common/Button.jsx";
import { Card } from "../common/Card.jsx";
import { TextField } from "../common/TextField.jsx";

const LOGO_SIZE = 360; // px — plenty for a ~1.3in printed logo, small enough for localStorage

/** Downscales an image file to a square PNG data URL (centre-cropped). */
function fileToLogoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = LOGO_SIZE;
      canvas
        .getContext("2d")
        .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, LOGO_SIZE, LOGO_SIZE);
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

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setHeader({ logoDataUrl: await fileToLogoDataUrl(file) });
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
              {header.logoDataUrl ? <img src={header.logoDataUrl} alt="Church logo" /> : <span>No logo</span>}
            </div>
            <label className="btn btn-secondary btn-sm">
              Upload logo
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onLogo} hidden />
            </label>
            {header.logoDataUrl && (
              <Button size="sm" variant="ghost" onClick={() => setHeader({ logoDataUrl: "" })}>
                Remove
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

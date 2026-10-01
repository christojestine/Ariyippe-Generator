/**
 * loadLogo.js
 *
 * Browser-side: resolves the header's logo setting into image data for the
 * PDF builder. The default logo is bundled with the app
 * (src/assets/images/default-logo.png).
 */

import defaultLogoUrl from "../../assets/images/default-logo.png";

export const DEFAULT_LOGO_URL = defaultLogoUrl;

/** @param {string} src */
function imageSize(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not load the logo image"));
    img.src = src;
  });
}

let defaultLogo = null;

/**
 * @param {{ logoMode?: "default" | "custom" | "none", logoDataUrl?: string }} header
 * @returns {Promise<{ data: string | Uint8Array, width: number, height: number } | null>}
 */
export async function resolveLogo(header) {
  // Notices saved before logo modes existed have no logoMode: an uploaded
  // logo stays custom, otherwise the default logo is used.
  const mode = header.logoMode ?? (header.logoDataUrl ? "custom" : "default");

  if (mode === "none") return null;
  if (mode === "custom" && header.logoDataUrl) {
    return { data: header.logoDataUrl, ...(await imageSize(header.logoDataUrl)) };
  }

  if (!defaultLogo) {
    defaultLogo = Promise.all([
      fetch(DEFAULT_LOGO_URL).then((res) => {
        if (!res.ok) throw new Error(`Could not load the default logo (${res.status})`);
        return res.arrayBuffer();
      }),
      imageSize(DEFAULT_LOGO_URL),
    ])
      .then(([buf, size]) => ({ data: new Uint8Array(buf), ...size }))
      .catch((err) => {
        defaultLogo = null; // allow a retry on the next export
        throw err;
      });
  }
  return defaultLogo;
}

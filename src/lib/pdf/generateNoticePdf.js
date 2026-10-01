/**
 * generateNoticePdf.js
 *
 * Browser-side entry point to the PDF builder, shared by the export dialog
 * and the live preview. The builder, fonts and logo are loaded lazily so
 * the first screen stays light.
 */

/**
 * @param {import("./buildAriyippuPdf.js").Notice} notice
 * @returns {Promise<{ blob: Blob, pageCount: number, oversizedItemIds: string[] }>}
 */
export async function generateNoticePdf(notice) {
  const [{ buildAriyippuPdf }, { loadFontBytes }, { resolveLogo }] = await Promise.all([
    import("./buildAriyippuPdf.js"),
    import("./loadFonts.js"),
    import("./loadLogo.js"),
  ]);
  const [fontBytes, logo] = await Promise.all([loadFontBytes(), resolveLogo(notice.header)]);
  const { doc, pageCount, oversizedItemIds } = buildAriyippuPdf(notice, fontBytes, { logo });
  return { blob: doc.output("blob"), pageCount, oversizedItemIds };
}

/** "dd.mm.yyyy" → "ariyippu-yyyy-mm-dd.pdf"; otherwise a safe slug. */
export function pdfFileName(noticeDate) {
  const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(noticeDate.trim());
  const stamp = m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : noticeDate.replace(/[^\w-]+/g, "-");
  return `ariyippu-${stamp || "notice"}.pdf`;
}

/** Saves a blob URL under the given file name. */
export function downloadUrl(url, fileName) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
}

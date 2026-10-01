/**
 * loadFonts.js
 *
 * Browser-side font loader: fetches the bundled font files once and caches
 * the bytes for later exports.
 */

import pooramUrl from "../../assets/fonts/NiyokkamPooram.ttf";
import serifRegularUrl from "../../assets/fonts/NotoSerif-Regular.ttf";
import serifBoldUrl from "../../assets/fonts/NotoSerif-Bold.ttf";
import serifItalicUrl from "../../assets/fonts/NotoSerif-Italic.ttf";
import serifBoldItalicUrl from "../../assets/fonts/NotoSerif-BoldItalic.ttf";

const URLS = {
  pooram: pooramUrl,
  serifRegular: serifRegularUrl,
  serifBold: serifBoldUrl,
  serifItalic: serifItalicUrl,
  serifBoldItalic: serifBoldItalicUrl,
};

let cache = null;

/** @returns {Promise<import("./fonts.js").FontBytes>} */
export function loadFontBytes() {
  if (!cache) {
    cache = Promise.all(
      Object.entries(URLS).map(async ([key, url]) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Could not load font ${key} (${res.status})`);
        return [key, new Uint8Array(await res.arrayBuffer())];
      }),
    )
      .then(Object.fromEntries)
      .catch((err) => {
        cache = null; // allow a retry on the next export
        throw err;
      });
  }
  return cache;
}

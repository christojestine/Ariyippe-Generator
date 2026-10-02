# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A client-only React app for composing a weekly Malayalam parish notice (അറിയിപ്പ് / "Ariyippu") and exporting a print-ready A4 PDF that mirrors the parish's printed layout. There is no backend. It deploys as a static site to GitHub Pages.

## Commands

Use pnpm (version pinned in `package.json` `packageManager`). Node 22 or newer is required.

```sh
pnpm install
pnpm dev                     # rspack dev server on http://localhost:5173
pnpm build                   # static output in dist/
pnpm test                    # node --test "src/**/*.test.js"
node --test src/lib/pdf/layout.test.js                       # a single test file
node --test --test-name-pattern="justifies" src/lib/pdf/layout.test.js   # a single test
node tools/render-sample.mjs out.pdf [logo.png]              # render the sample notice to PDF without a browser
```

There is no linter or formatter configured. Tests use the built-in `node:test` and `node:assert` with no test framework, so any code under test must be pure ESM that runs in Node without a DOM.

`.github/workflows/deploy.yml` runs `pnpm test` and `pnpm build` on every push to `main`, then publishes `dist/` to GitHub Pages. `rspack.config.js` uses `publicPath: "auto"` so asset URLs stay relative and the site works under any sub-path. Keep it that way.

## Hard constraint: everything is bundled

Every font (UI and PDF) lives in `src/assets/fonts/` and is loaded through `@font-face` in `src/styles/app.css` or through the PDF font loader. Icons are inline SVG paths in `src/components/common/Icon.jsx`. Do not add Google Fonts, CDN links, emoji or symbol characters as icons, and do not rely on OS-installed fonts. The app must look identical on any machine and keep working offline.

## Architecture

### State
`src/store/useAriyippuStore.js` is a single Zustand store and the only source of truth. It is persisted to localStorage under the key `ariyippu-notice-v1`, and only `notice`, `inputMode` and `theme` are persisted. If you change the shape of `notice`, persisted data from older versions will still be loaded, so either stay backward compatible or bump the key. `src/data/notice.js` defines the notice shape, the default header and signature, the default section templates and the 27.09.2026 sample notice.

Notice shape: `{ header, noticeDate: "dd.mm.yyyy", sections: [{ id, kind: "numbered"|"bulleted"|"line", heading: RichDoc|null, items: [{ id, content: RichDoc }] }], signature }`. A RichDoc is TipTap/ProseMirror JSON. `src/lib/text/richDoc.js` converts it to and from flat formatted "runs" (`{ text, bold, italic, underline }`).

### Text input (Manglish, English, Inscript)
Items are edited in TipTap (`components/editor/RichTextEditor.jsx`). Input modes are implemented as a ProseMirror plugin in `src/lib/editor/inputModesExtension.js`. In Manglish mode the Latin word before the cursor is transliterated when a word boundary is typed, and Backspace right after a conversion restores the Latin word. In Inscript mode the physical keys are remapped. The mode itself lives in the store and reaches the extension through `getMode`/`cycleMode` options. The transliteration tables are pure modules in `src/lib/translit/` (`manglish.js`, `inscript.js`), and each has tests.

### PDF pipeline (the core of the app)
All modules here work in both the browser and Node. Font bytes and the logo are passed in rather than fetched.

1. `lib/pdf/generateNoticePdf.js` is the browser entry point. It lazy-imports the builder, `loadFonts.js` (fetches and caches the bundled TTFs) and `loadLogo.js` (default, custom data URL or none). Both the live preview (`components/preview/PreviewPanel.jsx`, debounced rebuild) and the export dialog (`components/generate/GeneratePanel.jsx`) use it.
2. `lib/pdf/buildAriyippuPdf.js` holds the page geometry and typography constants, builds blocks (header, title, section headings, items, signature) and draws them with jsPDF.
3. Malayalam is not drawn as Unicode. `lib/text/segmentScript.js` splits text into Malayalam and Latin segments. Malayalam segments are converted by `lib/mltt/unicode2ascii.js` (+ `mapTable.js`) into legacy ML-TT ASCII glyph codes and drawn with the embedded `NiyokkamPooram.ttf`. Latin text, digits and ₹ are drawn with embedded Noto Serif. ML-TT text is set larger (`BODY.ml` vs `BODY.latin`) so both scripts look the same size.
4. `lib/pdf/layoutParagraph.js` is pure, and text measurement is injected into it. It wraps and justifies mixed-script runs, and the ML-TT conversion happens here, so measuring and drawing see the same glyphs.
5. `lib/pdf/paginate.js` is pure. It places blocks so that an item is never split across pages. It drops `spaceBefore` at the top of a page and honours `keepWithNext` for headings. Only a block taller than a whole page is split, and those blocks are returned as `oversizedItemIds`, which go into the store so the editor can flag them.
6. The ML-TT font has no bold or italic faces. Bold is drawn with an outline stroke (`FAUX_BOLD_EM`) and italic with a shear transform (`ITALIC_SHEAR`).

When you change layout, check it with `node tools/render-sample.mjs` and the unit tests in `layout.test.js` and `unicode2ascii.test.js`.

### UI
`App.jsx` arranges the top bar (input mode, typing help, theme, sample/new, generate), the builder column (`HeaderSettings`, `SectionList` → `SectionPanel` → `ItemComposer`/`ItemStack`/`ItemCard`) and the live `PreviewPanel`. Theming uses `<html data-theme="dark|light">`. `index.html` sets it before first paint and `main.jsx` keeps it in sync with the store. All colours in `app.css` are theme tokens.

### Font build tools
- `python tools/build-font.py <ML-TT Pooram.ttf>` regenerates the patched `NiyokkamPooram.ttf`.
- `python tools/build-latin-fonts.py` regenerates the static Noto Serif TTFs.

Both scripts need `fonttools`.

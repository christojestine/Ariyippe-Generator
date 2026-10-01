# Ariyippu Generator

Compose the weekly parish notice (അറിയിപ്പ്) and export a print-ready PDF in the layout of the printed notice: church header with logo, dated title, numbered and bulleted sections, and the vicar's signature.

## Use

```sh
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # static site in dist/ (can be hosted on GitHub Pages)
pnpm test       # unit tests (converter, transliteration, layout, pagination)
```

1. Set the date (and, once, the header, logo and signature) in **Notice details**.
2. Type each item in a section and press **Add item** (or <kbd>Ctrl</kbd>+<kbd>Enter</kbd>). Items stack up numbered; they can be edited, reordered or deleted.
3. Click **Generate PDF**, check the summary, confirm, then download.

The church logo ([src/assets/images/default-logo.png](src/assets/images/default-logo.png)) is printed by default. Under **Edit header, logo & signature** you can upload another logo or choose none. Logos are printed whole, never cropped.

Work in progress is saved in the browser automatically. **Load sample** fills in the 27.09.2026 notice.

### Typing

| Mode | What it does |
|---|---|
| **Manglish → മ** | Each word becomes Malayalam when you type a space or punctuation (`paLLi` → പള്ളി). Press <kbd>Backspace</kbd> right after to keep the English word. |
| **English** | Text as typed. Use this for English, or for Malayalam typed with your own keyboard or IME. |
| **ഇൻസ്ക്രിപ്റ്റ്** | Standard Malayalam Inscript layout on the physical keys. |

Pasted Malayalam works in every mode. <kbd>Ctrl</kbd>+<kbd>M</kbd> switches mode, and <kbd>Ctrl</kbd>+<kbd>B</kbd>/<kbd>I</kbd>/<kbd>U</kbd> apply formatting. The full Manglish scheme is under **Typing help**.

## How the PDF is made

- Malayalam is converted from Unicode to ML-TT glyph codes (`src/lib/mltt`, from the Niyokkam Printout Generator) and drawn with the embedded `NiyokkamPooram` font. English, digits and ₹ use embedded Noto Serif. The PDF therefore looks the same on every device.
- `src/lib/pdf/layoutParagraph.js` wraps and justifies mixed-script text. `paginate.js` moves any item that does not fit to the next page, so **items are never split across pages**. Only an item taller than a whole page is split, and that item is flagged in the editor.
- The ML-TT font has no bold or italic faces, so bold is drawn with an outline stroke and italic with a slant.

## Deploy to GitHub Pages

`.github/workflows/deploy.yml` tests, builds and publishes `dist/` on every push to `main`.

1. Create a GitHub repository and push this folder to its `main` branch.
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The site appears at `https://<username>.github.io/<repo>/`. The **Actions** tab shows each deploy.

All fonts and icons are bundled and asset paths are relative, so it works under any repository name and keeps working offline after the first load.

## Dev tools

- `node tools/render-sample.mjs out.pdf [logo.png]` renders the sample notice without a browser.
- `python tools/build-latin-fonts.py` rebuilds the static Noto Serif fonts (needs `fonttools`).
- `python tools/build-font.py <ML-TT Pooram.ttf>` rebuilds the patched Malayalam font.

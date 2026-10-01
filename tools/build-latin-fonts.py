"""
build-latin-fonts.py

Builds the static Latin fonts bundled with the app from Google's variable
Noto fonts:

  - src/assets/fonts/NotoSerif-*.ttf  (PDF): the Malayalam print font
    (ML-TT encoding) maps ASCII codes to Malayalam glyphs, so English text,
    digits and symbols such as ₹ are drawn with a separate Latin font. jsPDF
    can only embed static TrueType fonts, so the variable font is instanced
    to Regular / Bold / Italic / BoldItalic.
  - src/assets/fonts/NotoSans-*.woff2 (UI): the app's interface font, bundled
    so the UI looks the same on every machine regardless of installed fonts.

All fonts are subset to keep the bundle small.

Usage (dev-only, requires `pip install fonttools brotli`):
  python tools/build-latin-fonts.py
"""

import io
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

BASE = "https://github.com/google/fonts/raw/main/ofl/"
OUT = Path(__file__).resolve().parent.parent / "src" / "assets" / "fonts"

# name → (variable source file, wght, flavor)
FONTS = {
    "NotoSerif-Regular.ttf": ("notoserif/NotoSerif%5Bwdth,wght%5D.ttf", 400, None),
    "NotoSerif-Bold.ttf": ("notoserif/NotoSerif%5Bwdth,wght%5D.ttf", 700, None),
    "NotoSerif-Italic.ttf": ("notoserif/NotoSerif-Italic%5Bwdth,wght%5D.ttf", 400, None),
    "NotoSerif-BoldItalic.ttf": ("notoserif/NotoSerif-Italic%5Bwdth,wght%5D.ttf", 700, None),
    "NotoSans-Regular.woff2": ("notosans/NotoSans%5Bwdth,wght%5D.ttf", 400, "woff2"),
    "NotoSans-SemiBold.woff2": ("notosans/NotoSans%5Bwdth,wght%5D.ttf", 600, "woff2"),
    "NotoSans-Bold.woff2": ("notosans/NotoSans%5Bwdth,wght%5D.ttf", 700, "woff2"),
}

# Basic Latin, Latin-1, Latin Extended-A, general punctuation, ₹, arrows,
# bullets.
UNICODES = (
    list(range(0x20, 0x7F))
    + list(range(0xA0, 0x180))
    + list(range(0x2010, 0x2028))
    + list(range(0x2190, 0x2200))
    + [0x2030, 0x2032, 0x2033, 0x20B9, 0x2122, 0x2212, 0x25CF]
)

_cache = {}


def fetch(name):
    if name not in _cache:
        with urllib.request.urlopen(BASE + name) as res:
            _cache[name] = res.read()
    return _cache[name]


def main():
    for out_name, (source, weight, flavor) in FONTS.items():
        font = TTFont(io.BytesIO(fetch(source)))
        font = instancer.instantiateVariableFont(font, {"wght": weight, "wdth": 100})

        options = subset.Options()
        options.layout_features = ["kern", "liga"]
        options.name_IDs = ["*"]
        options.flavor = flavor
        sub = subset.Subsetter(options)
        sub.populate(unicodes=UNICODES)
        sub.subset(font)

        out = OUT / out_name
        font.flavor = flavor
        font.save(out)
        print(f"wrote {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()

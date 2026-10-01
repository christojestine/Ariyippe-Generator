/**
 * manglish.js
 *
 * Transliterates Manglish (Malayalam typed with Latin letters) to Malayalam
 * Unicode, following the Mozhi / Varamozhi conventions:
 *
 *   Vowels      a aa/A i ii/ee/I u uu/oo/U R^ e E ai o O au/ou
 *   Consonants  k kh g gh ng | ch chh j jh nj | T Th D Dh N | th thh d dh n
 *               p ph/f b bh m | y r R/rr l L zh v/w | sh (ശ) S/Sh (ഷ) s h
 *   Specials    t → റ്റ, tt → ട്ട, nt → ന്റ, nk → ങ്ക, nch → ഞ്ച, x → ക്സ
 *   Anusvara    M, or a word-final m after a vowel (maram → മരം)
 *   Visarga     H
 *   Chillu      word-final n N l L r (avan → അവൻ), r before a consonant
 *               (kurbaana → കുർബാന), or explicit with ~ after n N l L r k
 *   ~           explicit chandrakkala (virama) after any other consonant
 *   _           breaks a conjunct (k_k → ക്‌ക)
 *
 * A consonant followed directly by another consonant forms a conjunct
 * (virama in between); a word ending in a bare consonant gets ് (aRiyipp →
 * അറിയിപ്പ്).
 *
 * Pure functions, no DOM — runs under node --test and in the browser.
 */

const VIRAMA = "്";
const ZWNJ = "‌";

/** token → [independent vowel, vowel sign] */
const VOWELS = {
  a: ["അ", ""],
  aa: ["ആ", "ാ"],
  A: ["ആ", "ാ"],
  i: ["ഇ", "ി"],
  ii: ["ഈ", "ീ"],
  ee: ["ഈ", "ീ"],
  I: ["ഈ", "ീ"],
  u: ["ഉ", "ു"],
  uu: ["ഊ", "ൂ"],
  oo: ["ഊ", "ൂ"],
  U: ["ഊ", "ൂ"],
  "R^": ["ഋ", "ൃ"],
  e: ["എ", "െ"],
  E: ["ഏ", "േ"],
  ai: ["ഐ", "ൈ"],
  ei: ["ഐ", "ൈ"],
  o: ["ഒ", "ൊ"],
  O: ["ഓ", "ോ"],
  au: ["ഔ", "ൌ"],
  ou: ["ഔ", "ൌ"],
};

/** token → consonant (or ready-made conjunct) */
const CONSONANTS = {
  k: "ക", c: "ക", q: "ക", kh: "ഖ", g: "ഗ", gh: "ഘ", ng: "ങ",
  ch: "ച", chh: "ഛ", Ch: "ഛ", j: "ജ", jh: "ഝ", nj: "ഞ",
  T: "ട", Th: "ഠ", D: "ഡ", Dh: "ഢ", N: "ണ",
  th: "ത", thh: "ഥ", d: "ദ", dh: "ധ", n: "ന",
  p: "പ", ph: "ഫ", f: "ഫ", b: "ബ", bh: "ഭ", m: "മ",
  y: "യ", r: "ര", R: "റ", rr: "റ", l: "ല", L: "ള", zh: "ഴ", v: "വ", w: "വ",
  sh: "ശ", S: "ഷ", Sh: "ഷ", s: "സ", h: "ഹ", z: "സ",
  t: "റ്റ", tt: "ട്ട", tth: "ത്ത", nt: "ന്റ", nth: "ന്ത", nk: "ങ്ക",
  nch: "ഞ്ച", x: "ക്സ", ksh: "ക്ഷ",
};

/** consonant token → chillu */
const CHILLU = { n: "ൻ", N: "ൺ", l: "ൽ", L: "ൾ", r: "ർ", k: "ൿ" };
/** Chillus that form automatically at the end of a word. */
const AUTO_CHILLU = new Set(["n", "N", "l", "L", "r"]);

const SPECIALS = {
  M: "ം",
  H: "ഃ",
  "~": "~",
  _: "_",
};

const TOKENS = [...Object.keys(VOWELS), ...Object.keys(CONSONANTS), ...Object.keys(SPECIALS)]
  .filter((t, i, all) => all.indexOf(t) === i)
  .sort((a, b) => b.length - a.length);

function kindOf(token) {
  if (token in VOWELS) return "vowel";
  if (token in CONSONANTS) return "consonant";
  return "special";
}

/**
 * Splits a Latin word into Manglish tokens (greedy longest match).
 * Characters that match no token are returned as literal tokens.
 *
 * @param {string} word
 * @returns {string[]}
 */
export function tokenize(word) {
  const tokens = [];
  let i = 0;
  while (i < word.length) {
    const token = TOKENS.find((t) => word.startsWith(t, i));
    if (token) {
      tokens.push(token);
      i += token.length;
    } else {
      tokens.push(word[i]);
      i += 1;
    }
  }
  return tokens;
}

/**
 * Transliterates a single Manglish word (no spaces) to Malayalam.
 *
 * @param {string} word
 * @returns {string}
 */
export function transliterateWord(word) {
  const tokens = tokenize(word);
  let out = "";
  // "start" | "consonant" (bare consonant, no vowel yet) | "vowel"
  let state = "start";
  let lastConsonant = null;

  tokens.forEach((token, i) => {
    const next = tokens[i + 1];
    const kind = kindOf(token);

    if (kind === "vowel") {
      const [independent, sign] = VOWELS[token];
      out += state === "consonant" ? sign : independent;
      state = "vowel";
      return;
    }

    if (kind === "consonant") {
      const atEnd = next === undefined;
      // Chillu: word-final n/N/l/L/r, or r before another consonant, when the
      // previous sound was a vowel (otherwise it is part of a conjunct).
      if (state === "vowel" && AUTO_CHILLU.has(token)) {
        const beforeConsonant = next !== undefined && kindOf(next) === "consonant" && next !== "y" && next !== "r";
        if (atEnd || (token === "r" && beforeConsonant)) {
          out += CHILLU[token];
          state = "chillu";
          lastConsonant = null;
          return;
        }
      }
      // Word-final m after a vowel is the anusvara (maram → മരം).
      if (token === "m" && atEnd && state === "vowel") {
        out += "ം";
        state = "vowel";
        return;
      }
      if (state === "consonant") out += VIRAMA;
      out += CONSONANTS[token];
      state = "consonant";
      lastConsonant = token;
      return;
    }

    if (token === "~") {
      if (state === "consonant") {
        if (lastConsonant in CHILLU) {
          // replace the bare consonant with its chillu
          out = out.slice(0, -CONSONANTS[lastConsonant].length) + CHILLU[lastConsonant];
        } else {
          out += VIRAMA;
        }
      } else if (state === "vowel" && out.endsWith("ു")) {
        // u~ → samvruthokaram (ു്)
        out += VIRAMA;
      }
      state = "chillu";
      return;
    }

    if (token === "_") {
      if (state === "consonant") out += VIRAMA + ZWNJ;
      state = "start";
      return;
    }

    if (token === "M" || token === "H") {
      out += SPECIALS[token];
      state = "vowel";
      return;
    }

    // Literal (digit, apostrophe, ...)
    out += token;
    state = "start";
  });

  if (state === "consonant") out += VIRAMA;
  return out;
}

const WORD_RE = /[A-Za-z~_^]+/g;

/**
 * Transliterates all Manglish words in a text; everything else (spaces,
 * digits, punctuation, existing Malayalam) passes through unchanged.
 *
 * @param {string} text
 * @returns {string}
 */
export function manglishToMalayalam(text) {
  return text.replace(WORD_RE, (word) => transliterateWord(word));
}

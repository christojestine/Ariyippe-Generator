/**
 * inscript.js
 *
 * Malayalam Inscript keyboard layout (the standard Indian Government layout,
 * as shipped with Windows / Linux / macOS). Keys are physical key codes
 * (KeyboardEvent.code) so the mapping works regardless of the OS keyboard
 * layout. Keys not listed here type normally.
 *
 * Chillus are typed as consonant + ് + ] (ZWJ), as on the OS layout.
 */

/** code → [unshifted, shifted]; null = type the key normally */
const LAYOUT = {
  Backquote: ["ൊ", "ഒ"],
  Minus: [null, "ഃ"],
  Equal: ["ൃ", "ഋ"],

  KeyQ: ["ൌ", "ഔ"],
  KeyW: ["ൈ", "ഐ"],
  KeyE: ["ാ", "ആ"],
  KeyR: ["ീ", "ഈ"],
  KeyT: ["ൂ", "ഊ"],
  KeyY: ["ബ", "ഭ"],
  KeyU: ["ഹ", "ങ"],
  KeyI: ["ഗ", "ഘ"],
  KeyO: ["ദ", "ധ"],
  KeyP: ["ജ", "ഝ"],
  BracketLeft: ["ഡ", "ഢ"],
  BracketRight: ["‍", "ഞ"],
  Backslash: ["‌", null],

  KeyA: ["ോ", "ഓ"],
  KeyS: ["േ", "ഏ"],
  KeyD: ["്", "അ"],
  KeyF: ["ി", "ഇ"],
  KeyG: ["ു", "ഉ"],
  KeyH: ["പ", "ഫ"],
  KeyJ: ["ര", "റ"],
  KeyK: ["ക", "ഖ"],
  KeyL: ["ത", "ഥ"],
  Semicolon: ["ച", "ഛ"],
  Quote: ["ട", "ഠ"],

  KeyZ: ["െ", "എ"],
  KeyX: ["ം", "ഁ"],
  KeyC: ["മ", "ണ"],
  KeyV: ["ന", null],
  KeyB: ["വ", "ഴ"],
  KeyN: ["ല", "ള"],
  KeyM: ["സ", "ശ"],
  Comma: [null, "ഷ"],
  Slash: ["യ", null],
};

/**
 * Returns the Malayalam text for a key press, or null when the key should
 * behave normally.
 *
 * @param {string} code      KeyboardEvent.code
 * @param {boolean} shift    KeyboardEvent.shiftKey
 * @returns {string | null}
 */
export function inscriptCharFor(code, shift) {
  const entry = LAYOUT[code];
  if (!entry) return null;
  return entry[shift ? 1 : 0];
}

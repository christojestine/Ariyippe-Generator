import { useState } from "react";
import { Button } from "../common/Button.jsx";
import { Modal } from "../common/Modal.jsx";
import { Icon } from "../common/Icon.jsx";

const MANGLISH_ROWS = [
  ["Vowels", "a aa/A i ee/I u oo/U e E ai o O au R^", "അ ആ ഇ ഈ ഉ ഊ എ ഏ ഐ ഒ ഓ ഔ ഋ"],
  ["k-group", "k kh g gh ng", "ക ഖ ഗ ഘ ങ"],
  ["ch-group", "ch chh j jh nj", "ച ഛ ജ ഝ ഞ"],
  ["T-group", "T Th D Dh N", "ട ഠ ഡ ഢ ണ"],
  ["th-group", "th thh d dh n", "ത ഥ ദ ധ ന"],
  ["p-group", "p ph/f b bh m", "പ ഫ ബ ഭ മ"],
  ["Others", "y r R l L zh v sh S/Sh s h", "യ ര റ ല ള ഴ വ ശ ഷ സ ഹ"],
  ["Specials", "t tt nt nk nch x ksh", "റ്റ ട്ട ന്റ ങ്ക ഞ്ച ക്സ ക്ഷ"],
  ["Chillu", "avan, avaL, avar, kal, kaN · or n~ N~ l~ L~ r~ k~", "അവൻ അവൾ അവർ കൽ കൺ · ൻ ൺ ൽ ൾ ർ ൿ"],
  ["Anusvaram", "maram · M", "മരം · ം"],
  ["Chandrakkala", "aRiyipp · p~", "അറിയിപ്പ് · പ്"],
];

const EXAMPLES = [
  ["kurbaana", "കുർബാന"],
  ["njaayar", "ഞായർ"],
  ["paLLi", "പള്ളി"],
  ["vishuddha", "വിശുദ്ധ"],
  ["prakaasham", "പ്രകാശം"],
  ["yooNit", "യൂണിറ്റ്"],
];

/** Cheat sheet for the input modes. */
export function TypingHelp() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        <Icon name="help" /> Typing help
      </Button>
      <Modal open={open} title="Typing Malayalam" onClose={() => setOpen(false)}>
        <div className="help">
          <h3>Input modes</h3>
          <ul>
            <li>
              <strong>Manglish → മ</strong>: type with English letters. Each word turns into Malayalam when you type a
              space or punctuation. Press <kbd>Backspace</kbd> right after to get the English word back, which is how you
              type English words in this mode.
            </li>
            <li>
              <strong>English</strong>: text stays as you type it. Use this for English, or for Malayalam typed with your
              own Malayalam keyboard (Windows, Google Input Tools, phone keyboard).
            </li>
            <li>
              <strong>ഇൻസ്ക്രിപ്റ്റ്</strong>: the standard Malayalam Inscript keyboard layout on your physical keys.
            </li>
            <li>
              Pasted Malayalam text works in every mode. <kbd>Ctrl</kbd>+<kbd>M</kbd> switches mode;{" "}
              <kbd>Ctrl</kbd>+<kbd>B</kbd>/<kbd>I</kbd>/<kbd>U</kbd> for bold, italic, underline. Select Manglish text and
              press <strong>a→അ</strong> to convert it in one go.
            </li>
          </ul>

          <h3>Manglish scheme</h3>
          <table className="help-table">
            <tbody>
              {MANGLISH_ROWS.map(([group, latin, ml]) => (
                <tr key={group}>
                  <th scope="row">{group}</th>
                  <td>
                    <code>{latin}</code>
                  </td>
                  <td className="ml-text">{ml}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="help-examples">
            {EXAMPLES.map(([latin, ml]) => (
              <span key={latin}>
                <code>{latin}</code> → <span className="ml-text">{ml}</span>
              </span>
            ))}
          </p>
          <p className="hint">
            A consonant followed by another consonant joins them (kk → ക്ക). Use <code>_</code> to keep them apart.
          </p>
        </div>
      </Modal>
    </>
  );
}

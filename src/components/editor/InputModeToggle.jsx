import { SegmentedToggle } from "../common/SegmentedToggle.jsx";
import { useAriyippuStore } from "../../store/useAriyippuStore.js";

const OPTIONS = [
  { value: "manglish", label: "Manglish → മ", hint: "Type Malayalam with English letters (e.g. paLLi → പള്ളി)" },
  { value: "english", label: "English", hint: "Type as-is: English, or Malayalam from your own keyboard" },
  { value: "inscript", label: "ഇൻസ്ക്രിപ്റ്റ്", hint: "Malayalam Inscript keyboard layout" },
];

/** Global input-mode switch (Ctrl+M cycles it from inside any editor). */
export function InputModeToggle({ size = "md" }) {
  const inputMode = useAriyippuStore((s) => s.inputMode);
  const setInputMode = useAriyippuStore((s) => s.setInputMode);
  return <SegmentedToggle label="Input mode" value={inputMode} options={OPTIONS} onChange={setInputMode} size={size} />;
}

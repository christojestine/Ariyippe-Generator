import { useAriyippuStore } from "../../store/useAriyippuStore.js";
import { Icon } from "./Icon.jsx";
import { SegmentedToggle } from "./SegmentedToggle.jsx";

const OPTIONS = [
  {
    value: "dark",
    hint: "Dark theme",
    label: (
      <>
        <Icon name="moon" /> Dark
      </>
    ),
  },
  {
    value: "light",
    hint: "Light theme",
    label: (
      <>
        <Icon name="sun" /> Light
      </>
    ),
  },
];

/** Dark / light colour theme switch (remembered with the notice). */
export function ThemeToggle() {
  const theme = useAriyippuStore((s) => s.theme);
  const setTheme = useAriyippuStore((s) => s.setTheme);
  return (
    <div className="theme-toggle">
      <SegmentedToggle label="Colour theme" value={theme} options={OPTIONS} onChange={setTheme} />
    </div>
  );
}

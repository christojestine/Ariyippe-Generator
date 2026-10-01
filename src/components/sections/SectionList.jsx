import { useAriyippuStore } from "../../store/useAriyippuStore.js";
import { Button } from "../common/Button.jsx";
import { SectionPanel } from "./SectionPanel.jsx";
import { Icon } from "../common/Icon.jsx";

/** All sections in print order, plus "add section". */
export function SectionList() {
  const sections = useAriyippuStore((s) => s.notice.sections);
  const addSection = useAriyippuStore((s) => s.addSection);

  return (
    <div className="section-list">
      {sections.map((section, i) => (
        <SectionPanel key={section.id} section={section} index={i} count={sections.length} />
      ))}
      <Button variant="secondary" className="add-section" onClick={() => addSection("numbered")}>
        <Icon name="plus" /> Add section
      </Button>
    </div>
  );
}

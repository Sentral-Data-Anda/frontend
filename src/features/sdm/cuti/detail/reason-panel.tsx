import { Panel } from "@/components/common/display";

import type { Cuti } from "../types";

/**
 * Satu-satunya tempat alasan cuti dirender (SDM README §0.3 no. 4), dan ia
 * penuh: alasan yang dipotong mengirim pembacanya menebak sisanya.
 */
interface PropTypes {
  cuti: Cuti;
}

export const ReasonPanel = (props: PropTypes) => {
  const { cuti } = props;

  return (
    <Panel label="Alasan">
      <p className="px-gutter py-3 text-body whitespace-pre-line wrap-break-word">
        {cuti.reason}
      </p>
    </Panel>
  );
};

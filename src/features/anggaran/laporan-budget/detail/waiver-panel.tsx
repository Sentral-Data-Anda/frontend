import { FormAlert } from "@/components/common/form";
import { formatDateTime } from "@/lib/format";
import type { GateWaiver } from "@/types/anggaran";

import { WAIVER_TITLE } from "../model";

interface PropTypes {
  waiver: GateWaiver;
}

export const WaiverPanel = (props: PropTypes) => {
  const { waiver } = props;

  return (
    <FormAlert
      tone="info"
      title={`${WAIVER_TITLE} · ${waiver.createdBy?.name ?? "bendahara"} · ${formatDateTime(waiver.createdAt)}`}
      message={waiver.reason}
    />
  );
};

import { Badge } from "@/components/common/display";
import type { JournalStatus } from "@/types/keuangan";

import { STATUS_VARIANT, statusLabelOf } from "../model";

interface PropTypes {
  status: JournalStatus;
  note?: string | null;
}

export const JournalStatusBadge = (props: PropTypes) => {
  const { status, note } = props;

  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {statusLabelOf(status)}
      {note ? (
        <span className="text-muted-foreground font-normal">({note})</span>
      ) : null}
    </Badge>
  );
};

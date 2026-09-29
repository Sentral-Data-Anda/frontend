import { Badge } from "@/components/common/display";
import type { PeriodStatus as Status } from "@/types/keuangan";

import { PERIOD_STATUS_VARIANT, statusLabel } from "../model";

interface PropTypes {
  status: Status;
}

export const PeriodStatus = (props: PropTypes) => {
  const { status } = props;

  return (
    <Badge variant={PERIOD_STATUS_VARIANT[status]}>{statusLabel(status)}</Badge>
  );
};

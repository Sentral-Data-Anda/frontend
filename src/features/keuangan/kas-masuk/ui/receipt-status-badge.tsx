import { Badge } from "@/components/common/display";
import type { CashStatus } from "@/types/keuangan";

import { STATUS_VARIANT, statusLabelOf } from "../model";

interface PropTypes {
  status: CashStatus;
}

export const ReceiptStatusBadge = (props: PropTypes) => {
  const { status } = props;

  return (
    <Badge variant={STATUS_VARIANT[status]}>{statusLabelOf(status)}</Badge>
  );
};

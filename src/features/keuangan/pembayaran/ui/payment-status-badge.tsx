import { Badge } from "@/components/common/display";
import type { PaymentStatus } from "@/types/keuangan";

import { STATUS_VARIANT, statusLabelOf } from "../model";

interface PropTypes {
  status: PaymentStatus;
}

export const PaymentStatusBadge = (props: PropTypes) => {
  const { status } = props;

  return (
    <Badge variant={STATUS_VARIANT[status]}>{statusLabelOf(status)}</Badge>
  );
};

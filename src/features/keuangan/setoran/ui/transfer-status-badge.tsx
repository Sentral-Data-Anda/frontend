import { Badge } from "@/components/common/display";
import { CASH_TRANSFER_STATUS_LABEL, type CashStatus } from "@/types/keuangan";

import { STATUS_VARIANT } from "../model";

interface PropTypes {
  status: CashStatus;
}

export const TransferStatusBadge = (props: PropTypes) => {
  const { status } = props;

  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {CASH_TRANSFER_STATUS_LABEL[status]}
    </Badge>
  );
};

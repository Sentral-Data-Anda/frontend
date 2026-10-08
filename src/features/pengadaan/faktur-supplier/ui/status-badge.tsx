import { Badge } from "@/components/common/display";

import { STATUS_VARIANT } from "../model";
import { INVOICE_STATUS_LABEL, type InvoiceStatus } from "../types";

interface PropTypes {
  status: InvoiceStatus;
}

export const InvoiceStatusBadge = (props: PropTypes) => {
  const { status } = props;

  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {INVOICE_STATUS_LABEL[status]}
    </Badge>
  );
};

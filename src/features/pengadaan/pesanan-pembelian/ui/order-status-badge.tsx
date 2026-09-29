import { Badge } from "@/components/common/display";

import { STATUS_VARIANT } from "../model";
import { ORDER_STATUS_LABEL, type OrderStatus } from "../types";

interface PropTypes {
  status: OrderStatus;
  note?: string | null;
}

export const OrderStatusBadge = (props: PropTypes) => {
  const { status, note } = props;

  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {ORDER_STATUS_LABEL[status]}
      {note ? (
        <span className="text-muted-foreground font-normal">({note})</span>
      ) : null}
    </Badge>
  );
};

import { Badge } from "@/components/common/display";

import {
  STOCK_STATUS_BADGE,
  STOCK_STATUS_LABEL,
  stockStatusOf,
} from "../model";
import type { StockItem } from "../types";

interface PropTypes {
  item: Pick<StockItem, "quantity" | "reorderPoint">;
}

export const StockStatus = (props: PropTypes) => {
  const { item } = props;

  const status = stockStatusOf(item);

  return (
    <Badge variant={STOCK_STATUS_BADGE[status]}>
      {STOCK_STATUS_LABEL[status]}
    </Badge>
  );
};

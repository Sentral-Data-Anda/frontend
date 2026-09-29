import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { isIncrease, signedQuantityOf } from "../model";
import type { Movement } from "../types";

interface PropTypes {
  movement: Movement;
  isBalanceShown?: boolean;
}

export const QuantityCell = (props: PropTypes) => {
  const { movement, isBalanceShown = false } = props;

  return (
    <span className="flex shrink-0 flex-col items-end tabular-nums">
      <span
        className={cn(
          "text-body font-semibold whitespace-nowrap",
          isIncrease(movement) && "text-success",
        )}
      >
        {signedQuantityOf(movement)} {movement.stockItem.unit.name}
      </span>
      {isBalanceShown ? (
        <span className="text-muted-foreground text-caption whitespace-nowrap">
          Sisa {formatNumber(movement.balanceAfter)}
        </span>
      ) : null}
    </span>
  );
};

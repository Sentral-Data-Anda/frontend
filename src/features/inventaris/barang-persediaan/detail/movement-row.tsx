import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  MOVEMENT_TYPE_LABEL,
  isMovementIncrease,
  signedQuantityOf,
  sourceLabelOf,
} from "../model";
import type { ItemMovement } from "../types";

interface PropTypes {
  movement: ItemMovement;
}

export const MovementRow = (props: PropTypes) => {
  const { movement } = props;

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 py-2 text-body">
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">
          {MOVEMENT_TYPE_LABEL[movement.type]} · {sourceLabelOf(movement)}
        </span>
        <span className="text-muted-foreground text-caption">
          {formatDate(movement.movementDate)}
        </span>
      </span>

      <span className="flex flex-col items-end tabular-nums">
        <span
          className={cn(
            "font-semibold",
            isMovementIncrease(movement) && "text-success",
          )}
        >
          {signedQuantityOf(movement)}
        </span>
        <span className="text-muted-foreground text-caption">
          Sisa {formatNumber(movement.balanceAfter)}
        </span>
      </span>
    </li>
  );
};

import { Badge } from "@/components/common/display";
import { cn } from "@/lib/utils";

import { bookingTimeOf } from "../model";
import { BOOKING_KIND_LABEL, type RoomBooking } from "../types";

interface PropTypes {
  item: RoomBooking;
  isClash: boolean;
}

export const ScheduleRow = (props: PropTypes) => {
  const { item, isClash } = props;

  const kind = [BOOKING_KIND_LABEL[item.kind], item.bapel?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      className={cn(
        "grid grid-cols-[6.5rem_minmax(0,1fr)_auto] items-center gap-x-3 border-t border-border px-3 py-2 first:border-t-0",
        isClash && "bg-warning/10",
      )}
    >
      <span className="text-body font-medium tabular-nums first-letter:uppercase">
        {bookingTimeOf(item)}
      </span>

      <span className="min-w-0">
        <span className="block truncate text-body" title={item.name}>
          {item.name}
        </span>
        <span className="text-muted-foreground block truncate text-caption">
          {kind}
        </span>
      </span>

      {isClash ? <Badge variant="warning">Bentrok</Badge> : <span />}
    </li>
  );
};

import Link from "next/link";

import { formatTimeRange } from "@/lib/format";

import { loanEditHref } from "../model";
import { USAGE_KIND_LABEL, type RoomUsage } from "../types";

interface PropTypes {
  usage: RoomUsage;
  isLinked: boolean;
}

export const UsageRow = (props: PropTypes) => {
  const { usage, isLinked } = props;

  return (
    <li className="grid grid-cols-[6.5rem_minmax(0,1fr)_auto] items-baseline gap-x-3 py-2 text-body">
      <span className="tabular-nums">
        {formatTimeRange(usage.startTime, usage.endTime)}
      </span>

      {isLinked ? (
        <Link
          href={loanEditHref(usage.code)}
          className="focus-visible:ring-ring -my-2 min-w-0 cursor-pointer truncate rounded-sm py-2 font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2"
        >
          {usage.name}
        </Link>
      ) : (
        <span className="min-w-0 truncate font-medium">{usage.name}</span>
      )}

      <span className="text-muted-foreground text-caption">
        {USAGE_KIND_LABEL[usage.kind]}
      </span>
    </li>
  );
};

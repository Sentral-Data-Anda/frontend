import Link from "next/link";

import { bookingTimeOf } from "../../peminjaman-ruang/model";
import { loanEditHref } from "../model";
import { USAGE_KIND_LABEL, type RoomUsage } from "../types";

interface PropTypes {
  usage: RoomUsage;
  isLinked: boolean;
}

export const UsageRow = (props: PropTypes) => {
  const { usage } = props;
  // Only a loan has a screen to open, and only if the caller may open it.
  const publicId = props.isLinked ? usage.publicId : undefined;

  return (
    <li className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-x-3 py-2 text-body">
      <span className="flex flex-col">
        <span className="tabular-nums first-letter:uppercase">
          {bookingTimeOf(usage)}
        </span>
        <span className="text-muted-foreground text-caption">
          {USAGE_KIND_LABEL[usage.kind]}
        </span>
      </span>

      {publicId ? (
        <Link
          href={loanEditHref(publicId)}
          title={usage.name}
          className="focus-visible:ring-ring -mx-1 -my-2.5 block min-w-0 cursor-pointer rounded-sm px-1 py-2.5 font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2"
        >
          <span className="line-clamp-2 wrap-break-word">{usage.name}</span>
        </Link>
      ) : (
        <span
          className="line-clamp-2 min-w-0 font-medium wrap-break-word"
          title={usage.name}
        >
          {usage.name}
        </span>
      )}
    </li>
  );
};

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const SIDE_GRID =
  "grid min-w-0 gap-4 @min-[40rem]:grid-cols-2 @min-[40rem]:@max-[66rem]:[&>*:last-child:nth-child(odd)]:col-span-2";

const SIDE_STACKED =
  "@min-[66rem]:grid-cols-3 @min-[66rem]:@max-[104rem]:[&>*:last-child:nth-child(3n+1)]:col-span-3 @min-[66rem]:@max-[104rem]:[&>*:last-child:nth-child(3n+2)]:col-span-2 @min-[104rem]:grid-cols-[repeat(auto-fit,minmax(24rem,1fr))]";

const SIDE_SPLIT =
  "@min-[66rem]:@max-[82rem]:grid-cols-3 @min-[66rem]:@max-[82rem]:[&>*:last-child:nth-child(3n+1)]:col-span-3 @min-[66rem]:@max-[82rem]:[&>*:last-child:nth-child(3n+2)]:col-span-2 @min-[82rem]:@max-[120rem]:grid-cols-1 @min-[82rem]:@max-[120rem]:[&>*:last-child:nth-child(odd)]:col-span-1 @min-[82rem]:@max-[120rem]:has-[>*:nth-child(5)]:grid-cols-2 @min-[82rem]:@max-[120rem]:has-[>*:nth-child(5)]:[&>*:last-child:nth-child(odd)]:col-span-2 @min-[120rem]:grid-cols-[repeat(auto-fit,minmax(24rem,1fr))]";

const MAIN_STACKED =
  "@min-[104rem]:has-[>*:nth-child(2)]:grid-cols-2 @min-[150rem]:has-[>*:nth-child(3)]:grid-cols-3 @min-[104rem]:[&>*]:mx-auto @min-[104rem]:[&>*]:w-full @min-[104rem]:[&>*]:max-w-[90rem]";

const MAIN_SPLIT =
  "@min-[120rem]:has-[>*:nth-child(2)]:grid-cols-2 @min-[150rem]:has-[>*:nth-child(3)]:grid-cols-3 @min-[120rem]:[&>*]:mx-auto @min-[120rem]:[&>*]:w-full @min-[120rem]:[&>*]:max-w-[90rem]";

export function DashboardGrid({
  kpi,
  between,
  main,
  side,
  isStacked = false,
}: {
  kpi?: ReactNode;
  between?: ReactNode;
  main: ReactNode[];
  side: ReactNode[];
  isStacked?: boolean;
}) {
  const isSplit = !isStacked && main.length > 0 && side.length > 0;

  return (
    <div className="@container">
      <div className="flex flex-col gap-4">
        {kpi}
        {between}

        <div
          className={cn(
            "grid items-start gap-4",
            isSplit &&
              "@min-[82rem]:@max-[120rem]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]",
          )}
        >
          {main.length ? (
            <div
              className={cn(
                "grid min-w-0 gap-4",
                isStacked ? MAIN_STACKED : MAIN_SPLIT,
              )}
            >
              {main}
            </div>
          ) : null}
          {side.length ? (
            <div
              className={cn(SIDE_GRID, isStacked ? SIDE_STACKED : SIDE_SPLIT)}
            >
              {side}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

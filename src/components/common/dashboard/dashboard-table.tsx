import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  TABLE_HEAD,
  TABLE_HEAD_LINE_ON_CARD,
  TABLE_ROW_LINK,
  TABLE_ROWS_ON_CARD,
} from "@/components/common/list";
import { cn } from "@/lib/utils";

export type TableColumn = {
  label: string;
  width: string;
  align?: "right";
};

export type TableRow = {
  key: string;
  href?: string;
  cells: ReactNode[];
  label: string;
  compact: { title: ReactNode; meta?: ReactNode; trailing?: ReactNode };
};

export function DashboardTable({
  label,
  columns,
  rows,
}: {
  label: string;
  columns: TableColumn[];
  rows: TableRow[];
}) {
  const template = columns.map((c) => `minmax(0,${c.width})`).join(" ");

  return (
    <div className="@container -mx-2.5">
      <div
        role="table"
        aria-label={label}
        className="hidden @min-[40rem]:block"
        style={{ "--cols": template } as React.CSSProperties}
      >
        <div role="rowgroup">
          <div
            role="row"
            className={cn(
              TABLE_HEAD_LINE_ON_CARD,
              "bg-card sticky top-0 z-10 grid grid-cols-(--cols) gap-3 px-2.5 pr-7 pb-2",
            )}
          >
            {columns.map((column) => (
              <span
                key={column.label}
                role="columnheader"
                className={cn(
                  TABLE_HEAD,
                  column.align === "right" && "text-right",
                )}
              >
                {column.label}
              </span>
            ))}
          </div>
        </div>
        <div role="rowgroup" className={TABLE_ROWS_ON_CARD}>
          {rows.map((row) => (
            <div
              key={row.key}
              role="row"
              className={cn(
                "group/row relative grid min-h-10 grid-cols-(--cols) items-center gap-3 rounded-control px-2.5 py-2.5 pr-7",
                row.href && "hover:bg-muted transition-colors",
              )}
            >
              {row.cells.map((cell, index) => (
                <div
                  key={index}
                  role="cell"
                  className={cn(
                    "min-w-0 text-body tabular-nums",
                    columns[index]?.align === "right" &&
                      "flex justify-end text-right",
                  )}
                >
                  {index === 0 && row.href ? (
                    <Link
                      href={row.href}
                      aria-label={row.label}
                      className={cn("block", TABLE_ROW_LINK)}
                    >
                      {cell}
                    </Link>
                  ) : (
                    cell
                  )}
                </div>
              ))}
              {row.href ? (
                <ChevronRight
                  className="text-muted-foreground absolute top-1/2 right-2 size-3.5 -translate-y-1/2 opacity-0 transition-opacity group-hover/row:opacity-100"
                  aria-hidden
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <ul
        aria-label={label}
        className={cn(TABLE_ROWS_ON_CARD, "@min-[40rem]:hidden")}
      >
        {rows.map((row) => (
          <li
            key={row.key}
            className={cn(
              "group/row relative flex min-h-11 items-center gap-3 rounded-control px-2.5 py-2",
              row.href && "hover:bg-muted pr-7 transition-colors",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-medium">
                {row.href ? (
                  <Link
                    href={row.href}
                    aria-label={row.label}
                    className={TABLE_ROW_LINK}
                  >
                    {row.compact.title}
                  </Link>
                ) : (
                  row.compact.title
                )}
              </p>
              {row.compact.meta ? (
                <div className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-2 text-caption">
                  {row.compact.meta}
                </div>
              ) : null}
            </div>
            {row.compact.trailing ? (
              <div className="shrink-0 text-body font-semibold tabular-nums">
                {row.compact.trailing}
              </div>
            ) : null}
            {row.href ? (
              <ChevronRight
                className="text-muted-foreground absolute top-1/2 right-2 size-3.5 -translate-y-1/2 opacity-0 transition-opacity group-hover/row:opacity-100"
                aria-hidden
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TableTitle({ title, meta }: { title: string; meta?: string }) {
  return (
    <span className="block min-w-0">
      <span className="block truncate text-body font-medium" title={title}>
        {title}
      </span>
      {meta ? (
        <span
          className="text-muted-foreground block truncate text-caption"
          title={meta}
        >
          {meta}
        </span>
      ) : null}
    </span>
  );
}

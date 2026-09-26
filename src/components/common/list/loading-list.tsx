import type { ComponentProps } from "react";

import { LoadingTable } from "./loading-table";

export const LIST_DIVIDER = "[&>li+li>[data-slot=row-body]]:border-t";

export type LoadingShape = "leading" | "trailing";

export function LoadingRows({
  rows,
  shape = "leading",
}: {
  rows: number;
  shape?: LoadingShape;
}) {
  return Array.from({ length: rows }, (_, index) => (
    <li
      key={index}
      aria-hidden
      className="flex h-14 items-center gap-3 px-gutter"
    >
      {shape === "leading" ? (
        <span className="bg-skeleton size-9 shrink-0 animate-pulse rounded-full" />
      ) : null}

      <span
        data-slot="row-body"
        className="flex flex-1 items-center gap-3 self-stretch border-border"
      >
        <span className="flex flex-1 flex-col justify-center gap-1.5">
          <span className="bg-skeleton block h-3 w-2/5 animate-pulse rounded" />
          <span className="bg-skeleton block h-2.5 w-1/4 animate-pulse rounded" />
        </span>
        {shape === "trailing" ? (
          <span className="bg-skeleton block h-3 w-20 shrink-0 animate-pulse rounded" />
        ) : null}
      </span>
    </li>
  ));
}

export function LoadingList({
  rows = 6,
  shape,
}: {
  rows?: number;
  shape?: LoadingShape;
}) {
  return (
    <div role="status" aria-busy="true">
      <ul className={LIST_DIVIDER}>
        <LoadingRows rows={rows} shape={shape} />
      </ul>

      <span className="sr-only">Memuat daftar…</span>
    </div>
  );
}

export function LoadingDataList({
  table,
  shape,
}: {
  table?: { columns: ComponentProps<typeof LoadingTable>["columns"] };
  shape?: LoadingShape;
}) {
  if (!table) return <LoadingList shape={shape} />;

  return (
    <>
      <div className="md:hidden">
        <LoadingList />
      </div>

      <div className="hidden md:block">
        <LoadingTable columns={table.columns} />
      </div>
    </>
  );
}

import type { ComponentProps } from "react";

import { LoadingTable } from "@/components/common/list/loading-table";

export const LIST_DIVIDER = "[&>li+li>[data-slot=row-body]]:border-t";

export function LoadingRows({ rows }: { rows: number }) {
  return Array.from({ length: rows }, (_, index) => (
    <li
      key={index}
      aria-hidden
      className="flex h-14 items-center gap-3 px-gutter"
    >
      <span className="bg-primary-200 size-9 shrink-0 animate-pulse rounded-full" />

      <span
        data-slot="row-body"
        className="flex flex-1 flex-col justify-center gap-1.5 self-stretch border-border"
      >
        <span className="bg-primary-200 block h-3 w-2/5 animate-pulse rounded" />
        <span className="bg-primary-200 block h-2.5 w-1/4 animate-pulse rounded" />
      </span>
    </li>
  ));
}

export function LoadingList({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true">
      <ul className={LIST_DIVIDER}>
        <LoadingRows rows={rows} />
      </ul>

      <span className="sr-only">Memuat daftar…</span>
    </div>
  );
}

export function LoadingDataList({
  table,
}: {
  table?: { columns: ComponentProps<typeof LoadingTable>["columns"] };
}) {
  if (!table) return <LoadingList />;

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

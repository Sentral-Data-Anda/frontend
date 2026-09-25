import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

import type { DataTableColumn } from "./data-table";
import {
  TABLE_HEAD,
  TABLE_ROW_LINE_ON_CANVAS,
  TABLE_SECONDARY,
} from "./table-style";

export const ROW_BLEED = "px-2.5";

export const ROW_LINE = TABLE_ROW_LINE_ON_CANVAS;

export const TABLE_CONTAINER = "@container px-gutter";
export const TABLE_GRID =
  "grid grid-cols-(--cols-narrow) items-center gap-4 @min-[52rem]:grid-cols-(--cols)";

type SkeletonColumn = Pick<
  DataTableColumn<never>,
  "key" | "header" | "width" | "narrowWidth" | "isSecondary"
>;

export function tableTemplate(columns: SkeletonColumn[]): CSSProperties {
  const tracks = (list: SkeletonColumn[]) =>
    list.map((column) => column.width).join(" ");

  return {
    "--cols": tracks(columns),
    "--cols-narrow": columns
      .filter((column) => !column.isSecondary)
      .map((column) => column.narrowWidth ?? column.width)
      .join(" "),
  } as CSSProperties;
}

export function LoadingTableRows({
  columns,
  rows,
}: {
  columns: SkeletonColumn[];
  rows: number;
}) {
  return Array.from({ length: rows }, (_, index) => (
    <div
      key={index}
      aria-hidden
      className={cn(
        ROW_BLEED,
        ROW_LINE,
        TABLE_GRID,
        "relative min-h-14 py-2 pr-12",
      )}
    >
      {columns.map((column, columnIndex) => (
        <span
          key={column.key}
          className={cn(
            "bg-primary-200 block h-3 animate-pulse rounded",
            columnIndex === 0 ? "w-3/5" : "w-2/5",
            column.isSecondary && TABLE_SECONDARY,
          )}
        />
      ))}
    </div>
  ));
}

export function LoadingTable({
  columns,
  rows = 6,
}: {
  columns: SkeletonColumn[];
  rows?: number;
}) {
  return (
    <div role="status" aria-busy="true" className={TABLE_CONTAINER}>
      <div aria-hidden className="-mx-2.5" style={tableTemplate(columns)}>
        <div
          className={cn(ROW_BLEED, ROW_LINE, TABLE_GRID, "relative py-2 pr-12")}
        >
          {columns.map((column) => (
            <span
              key={column.key}
              className={cn(TABLE_HEAD, column.isSecondary && TABLE_SECONDARY)}
            >
              {column.header}
            </span>
          ))}
        </div>

        <LoadingTableRows columns={columns} rows={rows} />
      </div>

      <span className="sr-only">Memuat daftar…</span>
    </div>
  );
}

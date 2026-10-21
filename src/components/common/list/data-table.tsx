"use client";

import { useId, type ReactNode, type Ref } from "react";

import { SelectField } from "@/components/common/control";
import { LIMIT_ALL, type ListLimit } from "@/hooks/use-list-params";
import { cn } from "@/lib/utils";

import { DataListPager, type DataListPagination } from "./data-list-pagination";
import { DataRowActions, type RowActions } from "./data-row-actions";
import {
  LoadingTableRows,
  ROW_BLEED,
  TABLE_CONTAINER,
  TABLE_GRID,
  tableTemplate,
} from "./loading-table";
import {
  TABLE_HEAD,
  TABLE_HEAD_LINE_ON_CARD,
  TABLE_ROWS_ON_CARD,
  TABLE_SECONDARY,
  alignClass,
} from "./table-style";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  width: string;
  narrowWidth?: string;
  cell: (item: T) => ReactNode;
  isSecondary?: boolean;
  align?: "start" | "end";
};

export type DataTableConfig<T> = {
  columns: DataTableColumn<T>[];
  // Baris sengaja bukan tautan: menyenggol baris tidak boleh membuka form.
  getRowActions?: (item: T) => RowActions | undefined;
};

export function getRangeLabel(
  page: number,
  limit: ListLimit,
  totalData: number,
): string {
  if (totalData <= 0) return "0 dari 0";

  // Tanpa batas: satu halaman memuat semuanya, jadi rentangnya seluruh data.
  if (limit === LIMIT_ALL) return `1–${totalData} dari ${totalData}`;

  const from = Math.min((page - 1) * limit + 1, totalData);
  const to = Math.min(page * limit, totalData);

  return `${from}–${to} dari ${totalData}`;
}

const LIMIT_OPTIONS = [
  ...[10, 25, 50].map((limit) => ({
    value: String(limit),
    label: String(limit),
  })),
  { value: LIMIT_ALL, label: "Semua" },
];

// `Number("all")` adalah NaN dan jatuh ke ukuran bawaan; dipisah agar bisa diuji.
export const toLimit = (value: string): ListLimit =>
  value === LIMIT_ALL ? LIMIT_ALL : Number(value);

export function DataTable<T>({
  items,
  getKey,
  label,
  config,
  isRefreshing = false,
  pendingRows = 0,
  rowsRef,
}: {
  items: T[];
  getKey: (item: T) => string;
  label: string;
  config: DataTableConfig<T>;
  isRefreshing?: boolean;
  pendingRows?: number;
  rowsRef?: Ref<HTMLDivElement>;
}) {
  const { columns, getRowActions } = config;

  return (
    <div className={TABLE_CONTAINER}>
      <div
        role="table"
        aria-label={label}
        className="bg-card border-hairline overflow-hidden rounded-lg border"
        style={tableTemplate(columns)}
      >
        <div
          role="rowgroup"
          className="bg-muted/40 sticky top-0 z-10 backdrop-blur-md"
        >
          <div
            role="row"
            className={cn(
              ROW_BLEED,
              TABLE_HEAD_LINE_ON_CARD,
              TABLE_GRID,
              "relative py-2.5 pr-24",
            )}
          >
            {columns.map((column) => (
              <span
                key={column.key}
                role="columnheader"
                className={cn(
                  TABLE_HEAD,
                  column.isSecondary && TABLE_SECONDARY,
                  alignClass(column.align),
                )}
              >
                {column.header}
              </span>
            ))}
          </div>
        </div>

        <div
          ref={rowsRef}
          role="rowgroup"
          className={cn(
            TABLE_ROWS_ON_CARD,
            "transition-opacity",
            isRefreshing && "opacity-60",
          )}
        >
          {items.map((item, index) => {
            const actions = getRowActions?.(item);

            return (
              <div
                key={getKey(item)}
                role="row"
                data-row-id={getKey(item)}
                className={cn(
                  ROW_BLEED,
                  TABLE_GRID,
                  "group/row relative min-h-14 py-2 pr-24",
                  // Selang-seling agar mata tidak melompat; 0.6 terbaca di kartu putih.
                  index % 2 === 1 && "bg-muted/60",
                )}
              >
                {columns.map((column) => (
                  <div
                    key={column.key}
                    role="cell"
                    className={cn(
                      "min-w-0 text-body",
                      column.isSecondary && TABLE_SECONDARY,
                      alignClass(column.align),
                    )}
                  >
                    {column.cell(item)}
                  </div>
                ))}

                {actions ? (
                  <span className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center">
                    <DataRowActions actions={actions} />
                  </span>
                ) : null}
              </div>
            );
          })}

          {pendingRows ? (
            <LoadingTableRows columns={columns} rows={pendingRows} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function DataTableFooter({
  pagination,
  itemNoun = "data",
}: {
  pagination: Extract<DataListPagination, { mode: "pages" }>;
  itemNoun?: string;
}) {
  const { page, totalPage, totalData, limit, onPickPage, onPickLimit } =
    pagination;
  const limitId = useId();

  return (
    <div className="@container/footer">
      <div className="flex min-h-12 flex-wrap items-center gap-x-6 gap-y-3 px-gutter pt-3">
        {totalData !== undefined && limit !== undefined ? (
          <p className="text-muted-foreground text-body tabular-nums">
            Menampilkan {getRangeLabel(page, limit, totalData)} {itemNoun}
          </p>
        ) : null}

        {onPickLimit && limit !== undefined ? (
          <div className="flex items-center gap-2">
            <label
              htmlFor={limitId}
              className="text-muted-foreground sr-only text-body @min-[50rem]/footer:not-sr-only"
            >
              Baris per halaman
            </label>
            <SelectField
              id={limitId}
              value={String(limit)}
              // "Semua" bukan angka: `Number("all")` adalah NaN.
              onValueChange={(value) => onPickLimit(toLimit(value))}
              options={LIMIT_OPTIONS}
              // Cukup lebar untuk kata "Semua"; `w-20` memotongnya jadi "Sem…".
              className="w-24 tabular-nums"
            />
          </div>
        ) : null}

        {totalPage > 1 ? (
          <DataListPager
            page={page}
            totalPage={totalPage}
            onPickPage={onPickPage}
            className="mt-0 ml-auto px-0"
          />
        ) : null}
      </div>
    </div>
  );
}

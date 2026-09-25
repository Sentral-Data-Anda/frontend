"use client";

import Link from "next/link";
import { useId, type ReactNode, type Ref } from "react";

import { SelectField } from "@/components/common/control";
import { cn } from "@/lib/utils";

import { DataListPager, type DataListPagination } from "./data-list-pagination";
import {
  LoadingTableRows,
  ROW_BLEED,
  ROW_LINE,
  TABLE_CONTAINER,
  TABLE_GRID,
  tableTemplate,
} from "./loading-table";
import { TABLE_HEAD, TABLE_ROW_LINK, TABLE_SECONDARY } from "./table-style";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  width: string;
  narrowWidth?: string;
  cell: (item: T) => ReactNode;
  isSecondary?: boolean;
};

export type DataTableConfig<T> = {
  columns: DataTableColumn<T>[];
  getRowHref?: (item: T) => string | undefined;
  getRowLabel?: (item: T) => string;
  onRowOpen?: (item: T) => void;
  rowIcon?: ReactNode;
};

export function getRangeLabel(
  page: number,
  limit: number,
  totalData: number,
): string {
  if (totalData <= 0) return "0 dari 0";

  const from = Math.min((page - 1) * limit + 1, totalData);
  const to = Math.min(page * limit, totalData);

  return `${from}–${to} dari ${totalData}`;
}

const LIMIT_OPTIONS = [10, 25, 50].map((limit) => ({
  value: String(limit),
  label: String(limit),
}));

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
  const { columns, getRowHref, getRowLabel, onRowOpen, rowIcon } = config;

  return (
    <div className={TABLE_CONTAINER}>
      <div
        role="table"
        aria-label={label}
        className="-mx-2.5"
        style={tableTemplate(columns)}
      >
        <div
          role="rowgroup"
          className="bg-canvas/40 sticky top-0 z-10 backdrop-blur-md"
        >
          <div
            role="row"
            className={cn(
              ROW_BLEED,
              ROW_LINE,
              TABLE_GRID,
              "relative py-2 pr-12",
            )}
          >
            {columns.map((column) => (
              <span
                key={column.key}
                role="columnheader"
                className={cn(
                  TABLE_HEAD,
                  column.isSecondary && TABLE_SECONDARY,
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
          className={cn("transition-opacity", isRefreshing && "opacity-60")}
        >
          {items.map((item) => {
            const href = getRowHref?.(item);

            return (
              <div
                key={getKey(item)}
                role="row"
                data-row-id={getKey(item)}
                className={cn(
                  ROW_BLEED,
                  ROW_LINE,
                  TABLE_GRID,
                  "group/row relative min-h-14 rounded-control py-2 pr-12",
                  href && "hover:bg-card transition-colors",
                )}
              >
                {columns.map((column, index) => (
                  <div
                    key={column.key}
                    role="cell"
                    className={cn(
                      "min-w-0 text-body",
                      column.isSecondary && TABLE_SECONDARY,
                    )}
                  >
                    {index === 0 && href ? (
                      <Link
                        href={href}
                        onClick={() => onRowOpen?.(item)}
                        aria-label={getRowLabel?.(item)}
                        className={cn("block", TABLE_ROW_LINK)}
                      >
                        {column.cell(item)}
                      </Link>
                    ) : (
                      column.cell(item)
                    )}
                  </div>
                ))}

                {href && rowIcon ? (
                  <span
                    aria-hidden
                    className="text-muted-foreground group-hover/row:bg-muted group-hover/row:text-foreground pointer-events-none absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-control transition-colors [&_svg]:size-3.5"
                  >
                    {rowIcon}
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
              onValueChange={(value) => onPickLimit(Number(value))}
              options={LIMIT_OPTIONS}
              className="w-20 tabular-nums"
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

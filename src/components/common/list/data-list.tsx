"use client";

import { TriangleAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, type ReactNode } from "react";

import { EmptyState } from "@/components/common/feedback";
import { Button } from "@/components/ui";
import { useIsTableWidth } from "@/hooks/use-media";
import { clearListFocus, readListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import {
  DataListMore,
  DataListPager,
  type DataListPagination,
} from "./data-list-pagination";
import { DataTable, DataTableFooter, type DataTableConfig } from "./data-table";
import {
  LIST_DIVIDER,
  LoadingDataList,
  LoadingRows,
  type LoadingShape,
} from "./loading-list";

const textOf = (node: ReactNode) =>
  typeof node === "string" ? node : undefined;

export function DataListRow({
  id,
  title,
  meta,
  leading,
  trailing,
  className,
}: {
  id?: string;
  title: ReactNode;
  meta?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <li
      data-row-id={id}
      className={cn("flex h-14 items-center gap-3 px-gutter", className)}
    >
      {leading}

      <div
        data-slot="row-body"
        className="flex min-w-0 flex-1 items-center gap-3 self-stretch border-border"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-medium" title={textOf(title)}>
            {title}
          </p>

          {meta ? (
            <p
              className="text-muted-foreground truncate text-caption tabular-nums"
              title={textOf(meta)}
            >
              {meta}
            </p>
          ) : null}
        </div>

        {trailing ? (
          <div className="flex shrink-0 items-center gap-2">{trailing}</div>
        ) : null}
      </div>
    </li>
  );
}

export function DataList<T>({
  items,
  getKey,
  children,
  label,
  isLoading = false,
  isRefreshing = false,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  onClearFilter,
  pagination,
  table,
  loadingShape,
  itemNoun,
}: {
  items: T[] | undefined;
  getKey: (item: T) => string;
  children: (item: T) => ReactNode;
  label: string;
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onClearFilter?: () => void;
  pagination?: DataListPagination;
  table?: DataTableConfig<T>;
  loadingShape?: LoadingShape;
  itemNoun?: string;
}) {
  const pathname = usePathname();
  const listRef = useRef<HTMLElement | null>(null);
  const isTableWidth = useIsTableWidth();
  const isTable = table !== undefined && isTableWidth === true;

  const setListNode = (node: HTMLElement | null) => {
    listRef.current = node;
  };

  useEffect(() => {
    const list = listRef.current;

    if (!list) return;

    const id = readListFocus(pathname);
    const row = id
      ? [...list.querySelectorAll<HTMLElement>("[data-row-id]")].find(
          (element) => element.dataset.rowId === id,
        )
      : undefined;

    // Penanda dibuang hanya setelah barisnya ketemu; render pertama bisa masih berisi cache lama.
    if (!row) return;

    clearListFocus(pathname);
    row.dataset.focus = "";

    if (window.scrollY === 0) row.scrollIntoView({ block: "nearest" });

    const onEnd = () => delete row.dataset.focus;

    row.addEventListener("animationend", onEnd, { once: true });

    return () => row.removeEventListener("animationend", onEnd);
  }, [pathname, items]);

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center px-6 py-12 text-center"
      >
        <TriangleAlert className="text-destructive mb-3 size-8" aria-hidden />

        <p className="text-body font-medium">Gagal memuat data</p>

        <p className="text-muted-foreground mt-1 max-w-xs text-body text-balance">
          {error.message}
        </p>

        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            disabled={isRefreshing}
            className="mt-4"
          >
            {isRefreshing ? "Memuat…" : "Coba lagi"}
          </Button>
        ) : null}
      </div>
    );
  }

  if (isLoading || !items) {
    return <LoadingDataList table={table} shape={loadingShape} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          onClearFilter ? (
            <Button type="button" variant="outline" onClick={onClearFilter}>
              Hapus filter
            </Button>
          ) : null
        }
        className="py-12"
      />
    );
  }

  if (isTable) {
    return (
      <div aria-busy={isRefreshing || undefined}>
        <DataTable
          items={items}
          getKey={getKey}
          label={label}
          config={table}
          isRefreshing={isRefreshing}
          pendingRows={
            pagination?.mode === "more" && pagination.isLoadingMore ? 3 : 0
          }
          rowsRef={setListNode}
        />

        {pagination?.mode === "pages" ? (
          <DataTableFooter pagination={pagination} itemNoun={itemNoun} />
        ) : null}

        {pagination?.mode === "more" ? (
          <DataListMore {...pagination} shown={items.length} />
        ) : null}
      </div>
    );
  }

  return (
    <div aria-busy={isRefreshing || undefined}>
      <ul
        ref={setListNode}
        aria-label={label}
        className={cn(
          LIST_DIVIDER,
          "transition-opacity",
          isRefreshing && "opacity-60",
        )}
      >
        {items.map((item) => (
          <Fragment key={getKey(item)}>{children(item)}</Fragment>
        ))}

        {pagination?.mode === "more" && pagination.isLoadingMore ? (
          <LoadingRows rows={3} />
        ) : null}
      </ul>

      {pagination?.mode === "more" ? (
        <DataListMore {...pagination} shown={items.length} />
      ) : null}

      {pagination?.mode === "pages" && pagination.totalPage > 1 ? (
        <DataListPager {...pagination} />
      ) : null}
    </div>
  );
}

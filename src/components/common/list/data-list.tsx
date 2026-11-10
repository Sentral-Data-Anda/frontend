"use client";

import { TriangleAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

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
import {
  DataRowActions,
  RowActionsProvider,
  isNarrowActionOffered,
  useRowActions,
} from "./data-row-actions";
import { DataTable, DataTableFooter, type DataTableConfig } from "./data-table";
import {
  LoadingDataList,
  LoadingRows,
  type LoadingShape,
} from "./loading-list";
import {
  LIST_CARD,
  LIST_CARD_FRAME,
  LIST_CARD_HEAD,
  LIST_CARD_ROWS,
  TABLE_HEAD,
  TABLE_ROWS_ON_CARD,
} from "./table-style";

const textOf = (node: ReactNode) =>
  typeof node === "string" ? node : undefined;

export function DataListRow({
  id,
  title,
  meta,
  metaAction,
  leading,
  trailing,
  isTitleWrap = false,
  className,
}: {
  id?: string;
  title: ReactNode;
  meta?: ReactNode;
  metaAction?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  isTitleWrap?: boolean;
  className?: string;
}) {
  // A compact row's title is already its way to the detail page, so the
  // "view" action would only repeat it: two links with one name.
  const actions = useRowActions();
  const buttons = actions && { ...actions, view: undefined };

  return (
    <li
      data-row-id={id}
      className={cn(
        "flex items-center gap-3 px-gutter",
        isTitleWrap ? "min-h-14" : "h-14",
        className,
      )}
    >
      {leading}

      <div
        data-slot="row-body"
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 self-stretch border-border",
          isTitleWrap && "py-2",
        )}
      >
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-body font-medium",
              isTitleWrap ? "line-clamp-2 wrap-break-word" : "truncate",
            )}
            title={textOf(title)}
          >
            {title}
          </p>

          {meta || metaAction ? (
            <div className="flex min-w-0 items-center gap-2">
              {meta ? (
                <p
                  className="text-muted-foreground truncate text-caption tabular-nums"
                  title={textOf(meta)}
                >
                  {meta}
                </p>
              ) : null}

              {metaAction ? (
                <span className="relative z-10 shrink-0">{metaAction}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        {trailing || buttons ? (
          <div className="flex shrink-0 items-center gap-2">
            {trailing}

            {/* Lebarnya dijaga walau baris ini tidak menawarkan aksi, supaya
                nilai di kolom kanan tetap sebaris antarbaris. `relative z-10`
                wajib: tautan judul baris memakai TABLE_ROW_LINK yang melebar
                lewat ::after inset-0 ke seluruh baris, dan pseudo-element itu
                menutupi tombol aksi yang statis — klik titik-tiga malah
                membuka halaman detail. */}
            {buttons ? (
              <span className="relative z-10 flex min-w-control justify-end">
                <DataRowActions actions={buttons} />
              </span>
            ) : null}
          </div>
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
  isHeaderHidden = false,
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
  // Panel yang menyematkan daftar milik layar lain: judul kolomnya mengulang
  // label di sekitarnya.
  isHeaderHidden?: boolean;
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
            isLoading={isRefreshing}
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

  const narrowHeaders = isHeaderHidden ? undefined : table?.narrowHeaders;
  // Kolom aksi hanya dicadangkan bila ada baris yang benar-benar menawarkannya.
  // Tanpa hak akses, tidak ada tombol sama sekali, jadi kolom kanan memakai
  // ruang itu dan nilainya rata kanan penuh — header ikut bergeser.
  const isActionColumn =
    table?.getRowActions !== undefined &&
    items.some((item) => isNarrowActionOffered(table.getRowActions?.(item)));

  return (
    <div aria-busy={isRefreshing || undefined}>
      <div className={LIST_CARD_FRAME}>
        <div className={LIST_CARD}>
          {narrowHeaders ? (
            <div className={LIST_CARD_HEAD} aria-hidden>
              <span className={cn(TABLE_HEAD, "min-w-0 flex-1")}>
                {narrowHeaders.title}
              </span>

              {narrowHeaders.trailing ? (
                // Susunannya meniru sisi kanan baris agar judulnya jatuh tepat
                // di atas nilainya, bukan di atas tombol aksi.
                <span className="flex shrink-0 items-center gap-2">
                  <span className={TABLE_HEAD}>{narrowHeaders.trailing}</span>

                  {isActionColumn ? <span className="w-control" /> : null}
                </span>
              ) : null}
            </div>
          ) : null}

          <ul
            ref={setListNode}
            aria-label={label}
            className={cn(
              TABLE_ROWS_ON_CARD,
              LIST_CARD_ROWS,
              "transition-opacity",
              isRefreshing && "opacity-60",
            )}
          >
            {items.map((item) => (
              <RowActionsProvider
                key={getKey(item)}
                value={
                  isActionColumn ? table?.getRowActions?.(item) : undefined
                }
              >
                {children(item)}
              </RowActionsProvider>
            ))}

            {pagination?.mode === "more" && pagination.isLoadingMore ? (
              <LoadingRows rows={3} />
            ) : null}
          </ul>
        </div>
      </div>

      {pagination?.mode === "more" ? (
        <DataListMore {...pagination} shown={items.length} />
      ) : null}

      {pagination?.mode === "pages" && pagination.totalPage > 1 ? (
        <DataListPager {...pagination} />
      ) : null}
    </div>
  );
}

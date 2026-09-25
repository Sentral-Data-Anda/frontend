"use client";

import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { useEffect, useEffectEvent, useRef } from "react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export type DataListPagination =
  | {
      mode: "pages";
      page: number;
      totalPage: number;
      onPickPage: (page: number) => void;
      totalData?: number;
      limit?: number;
      onPickLimit?: (limit: number) => void;
    }
  | {
      mode: "more";
      isMoreAvailable: boolean;
      isLoadingMore: boolean;
      isLoadMoreError: boolean;
      isBusy: boolean;
      totalData: number;
      onLoadMore: () => void;
    };

type PageItem = number | "gap-start" | "gap-end";

export function getPageItems(page: number, totalPage: number): PageItem[] {
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, index) => from + index);

  if (totalPage <= 7) return range(1, totalPage);
  if (page <= 4) return [...range(1, 5), "gap-end", totalPage];
  if (page >= totalPage - 3)
    return [1, "gap-start", ...range(totalPage - 4, totalPage)];

  return [1, "gap-start", page - 1, page, page + 1, "gap-end", totalPage];
}

export function DataListPager({
  page,
  totalPage,
  onPickPage,
  className,
}: {
  page: number;
  totalPage: number;
  onPickPage: (page: number) => void;
  className?: string;
}) {
  return (
    <nav
      aria-label="Paginasi"
      className={cn("mt-4 flex justify-center px-gutter", className)}
    >
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Halaman sebelumnya"
          disabled={page <= 1}
          onClick={() => onPickPage(page - 1)}
        >
          <ChevronLeft aria-hidden />
        </Button>

        {getPageItems(page, totalPage).map((item) =>
          typeof item === "number" ? (
            <Button
              key={item}
              type="button"
              variant={item === page ? "default" : "ghost"}
              aria-label={`Halaman ${item}`}
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPickPage(item)}
              className="min-w-control px-2 tabular-nums"
            >
              {item}
            </Button>
          ) : (
            <span
              key={item}
              aria-hidden
              className="text-muted-foreground flex size-control items-center justify-center text-body"
            >
              …
            </span>
          ),
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Halaman berikutnya"
          disabled={page >= totalPage}
          onClick={() => onPickPage(page + 1)}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>

      <p aria-live="polite" className="sr-only">
        Halaman {page} dari {totalPage}
      </p>
    </nav>
  );
}

export function DataListMore({
  shown,
  totalData,
  isMoreAvailable,
  isLoadingMore,
  isLoadMoreError,
  isBusy,
  onLoadMore,
}: Extract<DataListPagination, { mode: "more" }> & { shown: number }) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const isButtonFocusedRef = useRef(false);
  const isAutoLoad = isMoreAvailable && !isBusy && !isLoadMoreError;
  const onIntersect = useEffectEvent(onLoadMore);

  useEffect(() => {
    const button = buttonRef.current;

    if (!button || !isAutoLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onIntersect();
      },
      { rootMargin: "0px 0px 400px 0px" },
    );

    observer.observe(button);

    return () => observer.disconnect();
  }, [isAutoLoad]);

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {`${shown} dari ${totalData} ditampilkan.`}
        {isLoadMoreError ? " Gagal memuat data berikutnya." : null}
      </p>

      {isMoreAvailable ? (
        <div className="flex min-h-12 items-center justify-center gap-1 px-gutter py-2">
          {isLoadMoreError ? (
            <p className="text-destructive text-body">Gagal memuat —</p>
          ) : null}

          <Button
            ref={(node: HTMLButtonElement | null) => {
              buttonRef.current = node;

              return () => {
                isButtonFocusedRef.current = document.activeElement === node;
                buttonRef.current = null;
              };
            }}
            type="button"
            variant="ghost"
            disabled={isLoadingMore}
            focusableWhenDisabled
            onClick={onLoadMore}
            className={cn(
              isLoadMoreError ? "text-primary" : "text-muted-foreground",
            )}
          >
            {isLoadMoreError ? (
              "Coba lagi"
            ) : isLoadingMore ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden />
                <span className="sr-only">Memuat…</span>
              </>
            ) : (
              "Muat lebih banyak"
            )}
          </Button>
        </div>
      ) : (
        <p
          ref={(node) => {
            if (node && isButtonFocusedRef.current) {
              isButtonFocusedRef.current = false;
              node.focus();
            }
          }}
          tabIndex={-1}
          className="text-muted-foreground flex min-h-12 items-center justify-center px-gutter text-body outline-none"
        >
          Semua data sudah ditampilkan
        </p>
      )}
    </>
  );
}

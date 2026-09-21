"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useEffectEvent, useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Dua bentuk paginasi, dipilih `useListQuery` per lebar layar — BUKAN oleh
 * layar. `DataList` hanya merender bentuk yang ia terima.
 */
export type DataListPagination =
  | {
      mode: "pages";
      page: number;
      totalPage: number;
      onPickPage: (page: number) => void;
    }
  | {
      mode: "more";
      hasMore: boolean;
      isLoadingMore: boolean;
      isLoadMoreError: boolean;
      /**
       * Query sedang mengambil apa pun, termasuk refetch latar semua halaman
       * setelah invalidasi. `onLoadMore` diabaikan selama itu.
       */
      isBusy: boolean;
      totalData: number;
      onLoadMore: () => void;
    };

type PageItem = number | "gap-start" | "gap-end";

/**
 * Nomor yang tampil di pager desktop. Selalu tepat 7 slot begitu `totalPage`
 * > 7, jadi lebar grup tidak berubah saat berpindah halaman dan tombol ‹ ›
 * tidak bergeser di bawah kursor.
 *
 *   1 2 3 4 5 … 12   ·   1 … 5 6 7 … 12   ·   1 … 8 9 10 11 12
 */
export function getPageItems(page: number, totalPage: number): PageItem[] {
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, index) => from + index);

  if (totalPage <= 7) return range(1, totalPage);
  if (page <= 4) return [...range(1, 5), "gap-end", totalPage];
  if (page >= totalPage - 3)
    return [1, "gap-start", ...range(totalPage - 4, totalPage)];

  return [1, "gap-start", page - 1, page, page + 1, "gap-end", totalPage];
}

/** Pager bernomor desktop: satu grup ringkas di bawah kartu. */
export function DataListPager({
  page,
  totalPage,
  onPickPage,
}: {
  page: number;
  totalPage: number;
  onPickPage: (page: number) => void;
}) {
  return (
    <nav aria-label="Paginasi" className="mt-4 flex justify-center px-gutter">
      <div className="bg-card flex items-center gap-0.5 rounded-lg p-1 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
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
              size="sm"
              aria-label={`Halaman ${item}`}
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPickPage(item)}
              className="min-w-7 px-1.5 tabular-nums"
            >
              {item}
            </Button>
          ) : (
            <span
              key={item}
              aria-hidden
              className="text-muted-foreground flex size-7 items-center justify-center text-body"
            >
              …
            </span>
          ),
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Halaman berikutnya"
          disabled={page >= totalPage}
          onClick={() => onPickPage(page + 1)}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>

      {/* Pembaca layar tidak melihat daftar berganti; nomor halamanlah yang
          mengabarkannya. */}
      <p aria-live="polite" className="sr-only">
        Halaman {page} dari {totalPage}
      </p>
    </nav>
  );
}

/**
 * Ujung daftar mobile/tablet, di dalam kartu. Tombolnya sekaligus sentinel:
 * `IntersectionObserver` memanggil `onLoadMore` saat tombol mendekati layar
 * (400px sebelum terlihat), dan tombol yang sama bisa difokus/ditekan bila
 * pengamatnya tidak terpicu atau pengguna memakai keyboard/pembaca layar.
 *
 * Tombol TIDAK diganti elemen lain selama masih ada data: memuat dan galat
 * hanya mengubah labelnya, jadi fokus keyboard tetap di tempatnya
 * (`focusableWhenDisabled` menjaga fokus saat ia nonaktif sementara). Saat
 * data habis tombolnya diganti teks penutup (juga bila semua muat di satu
 * halaman); bila tombol sedang difokus, fokus dipindah ke teks itu alih-alih
 * jatuh ke `<body>`.
 */
export function DataListMore({
  shown,
  totalData,
  hasMore,
  isLoadingMore,
  isLoadMoreError,
  isBusy,
  onLoadMore,
}: Extract<DataListPagination, { mode: "more" }> & { shown: number }) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const isButtonFocusedRef = useRef(false);
  const isAutoLoad = hasMore && !isBusy && !isLoadMoreError;
  const onIntersect = useEffectEvent(onLoadMore);

  // Pengamat dibuat ulang setiap kali query selesai mengambil — halaman
  // berikutnya maupun refetch latar (`isAutoLoad` kembali true). Panggilan
  // selama query sibuk diabaikan `onLoadMore`, jadi pengamat lama yang sempat
  // melapor saat itu tidak akan melapor lagi. Pengamat baru selalu melapor
  // keadaan awalnya, jadi bila tombol masih dekat layar — daftar pendek,
  // layar tinggi, atau sentinel terlihat selama refetch — halaman berikutnya
  // langsung diminta tanpa menunggu gulir lagi.
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

      {hasMore ? (
        <div className="border-border flex min-h-12 items-center justify-center gap-1 border-t px-3.5 py-2">
          {isLoadMoreError ? (
            <p className="text-destructive text-body">Gagal memuat —</p>
          ) : null}

          <Button
            ref={(node: HTMLButtonElement | null) => {
              buttonRef.current = node;

              // Dijalankan SEBELUM tombol dilepas dari DOM, jadi
              // `activeElement` masih menunjuk ke tombol bila ia difokus.
              return () => {
                isButtonFocusedRef.current = document.activeElement === node;
                buttonRef.current = null;
              };
            }}
            type="button"
            variant="ghost"
            size="sm"
            disabled={isLoadingMore}
            focusableWhenDisabled
            onClick={onLoadMore}
            className={cn(
              isLoadMoreError ? "text-primary" : "text-muted-foreground",
            )}
          >
            {isLoadMoreError
              ? "Coba lagi"
              : isLoadingMore
                ? "Memuat…"
                : "Muat lebih banyak"}
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
          className="border-border text-muted-foreground flex min-h-12 items-center justify-center border-t text-caption outline-none"
        >
          Semua data sudah ditampilkan
        </p>
      )}
    </>
  );
}

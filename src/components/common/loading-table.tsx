import type { CSSProperties } from "react";

import type { DataTableColumn } from "@/components/common/data-table";
import { cn } from "@/lib/utils";

/**
 * Berkas TANPA `"use client"`: kerangka tabel juga dirender sebagai fallback
 * `Suspense` di server (`LoadingDataList`), dan komponen klien tidak boleh
 * menerima konfigurasi kolom yang berisi fungsi `cell` dari server.
 */

/** Sisi kiri-kanan baris: bidang hover menjorok 10px keluar tepi konten. */
export const ROW_BLEED = "px-2.5";

/**
 * Garis bawah baris dari tepi konten ke tepi konten — TIDAK ikut menjorok
 * bersama bidang hover, supaya garisnya sejajar dengan kotak cari dan judul.
 */
export const ROW_LINE =
  "after:border-border after:pointer-events-none after:absolute after:inset-x-2.5 after:bottom-0 after:border-b";

type SkeletonColumn = Pick<DataTableColumn<never>, "key" | "header" | "width">;

/** Kerangka tabel: kepala asli + baris 56px, supaya data tiba tanpa lompatan. */
export function LoadingTable({
  columns,
  rows = 6,
}: {
  columns: SkeletonColumn[];
  rows?: number;
}) {
  const template = {
    "--cols": columns.map((column) => column.width).join(" "),
  } as CSSProperties;

  return (
    <div role="status" aria-busy="true" className="px-gutter">
      <div aria-hidden className="-mx-2.5" style={template}>
        <div
          className={cn(
            ROW_BLEED,
            ROW_LINE,
            "relative grid grid-cols-(--cols) items-center gap-4 py-2 pr-12",
          )}
        >
          {columns.map((column) => (
            <span
              key={column.key}
              className="text-muted-foreground truncate text-caption font-medium tracking-wide uppercase"
            >
              {column.header}
            </span>
          ))}
        </div>

        {/* key={index}: kerangka tidak punya identitas dari data. */}
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className={cn(
              ROW_BLEED,
              ROW_LINE,
              "relative grid min-h-14 grid-cols-(--cols) items-center gap-4 py-2 pr-12",
            )}
          >
            {columns.map((column, columnIndex) => (
              <span
                key={column.key}
                className={cn(
                  "bg-primary-200 block h-3 animate-pulse rounded",
                  columnIndex === 0 ? "w-3/5" : "w-2/5",
                )}
              />
            ))}
          </div>
        ))}
      </div>

      <span className="sr-only">Memuat daftar…</span>
    </div>
  );
}

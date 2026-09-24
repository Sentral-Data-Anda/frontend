import type { CSSProperties } from "react";

import type { DataTableColumn } from "@/components/common/data-table";
import {
  TABLE_HEAD,
  TABLE_ROW_LINE_ON_CANVAS,
  TABLE_SECONDARY,
} from "@/components/common/table-style";
import { cn } from "@/lib/utils";

/**
 * Berkas TANPA `"use client"`: kerangka tabel juga dirender sebagai fallback
 * `Suspense` di server (`LoadingDataList`), dan komponen klien tidak boleh
 * menerima konfigurasi kolom yang berisi fungsi `cell` dari server.
 */

/** Sisi kiri-kanan baris: bidang hover menjorok 10px keluar tepi konten. */
export const ROW_BLEED = "px-2.5";

/** Garis baris di kanvas (lihat `table-style.ts`). */
export const ROW_LINE = TABLE_ROW_LINE_ON_CANVAS;

/**
 * Kolom tabel: di tabel sempit (< 52rem — tablet 632px, 1024 dengan sidebar
 * penuh 714px) hanya kolom utama; kolom `isSecondary` ikut tampil begitu
 * tabelnya ≥ 52rem. Container query pada `TABLE_CONTAINER`, jadi yang
 * menentukan lebar tabel, bukan lebar layar. Jalur grid-nya ikut berganti
 * (`--cols-narrow` → `--cols`), karena sel yang `display: none` tidak
 * membuang jalurnya.
 */
export const TABLE_CONTAINER = "@container px-gutter";
export const TABLE_GRID =
  "grid grid-cols-(--cols-narrow) items-center gap-4 @min-[52rem]:grid-cols-(--cols)";

type SkeletonColumn = Pick<
  DataTableColumn<never>,
  "key" | "header" | "width" | "isSecondary"
>;

export function tableTemplate(columns: SkeletonColumn[]): CSSProperties {
  const tracks = (list: SkeletonColumn[]) =>
    list.map((column) => column.width).join(" ");

  return {
    "--cols": tracks(columns),
    "--cols-narrow": tracks(columns.filter((column) => !column.isSecondary)),
  } as CSSProperties;
}

/** Baris kerangka 56px, tanpa kepala — juga disisipkan saat memuat lagi. */
export function LoadingTableRows({
  columns,
  rows,
}: {
  columns: SkeletonColumn[];
  rows: number;
}) {
  // key={index}: kerangka tidak punya identitas dari data.
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

/** Kerangka tabel: kepala asli + baris 56px, supaya data tiba tanpa lompatan. */
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

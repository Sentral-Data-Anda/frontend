"use client";

import Link from "next/link";
import type { ReactNode, Ref } from "react";

import { SelectField } from "@/components/common/control/select-field";
import {
  DataListPager,
  type DataListPagination,
} from "@/components/common/list/data-list-pagination";
import {
  LoadingTableRows,
  ROW_BLEED,
  ROW_LINE,
  TABLE_CONTAINER,
  TABLE_GRID,
  tableTemplate,
} from "@/components/common/list/loading-table";
import {
  TABLE_HEAD,
  TABLE_ROW_LINK,
  TABLE_SECONDARY,
} from "@/components/common/list/table-style";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  /**
   * Jalur grid tabel lebar (≥ 52rem). Kolom DATA memakai `fr` dengan rasio
   * sesuai panjang isi yang khas (mis. nama `minmax(0,2.5fr)`, kode
   * `minmax(0,1fr)`), supaya sisa ruang di layar lebar terbagi ke SEMUA
   * celah. Kolom pendek yang dikunci `rem` justru melempar seluruh sisa ke
   * kolom `fr` dan membuat lubang ratusan piksel di tengah baris (terukur di
   * 1624 rail: 438px Nama → Kode). `rem` hanya untuk isi berlebar tetap
   * (ikon, aksi). Pedoman: pedoman-slicing.md §1.
   */
  width: string;
  /** Jalur grid di tabel sempit (< 52rem: tablet, 1024 bersidebar). Bawaan `width`. */
  narrowWidth?: string;
  cell: (item: T) => ReactNode;
  /**
   * Kolom pelengkap: disembunyikan di tabel sempit (< 52rem — tablet, 1024
   * dengan sidebar penuh) supaya kolom utama tidak terpotong.
   */
  isSecondary?: boolean;
};

/**
 * Susunan tabel sebuah daftar. Kolom pertama adalah "judul" baris: saat baris
 * bisa dibuka, isinya dibungkus tautan yang diregangkan menutupi seluruh
 * baris, jadi satu baris = satu target klik = satu perhentian Tab.
 */
export type DataTableConfig<T> = {
  columns: DataTableColumn<T>[];
  /** Tujuan baris. `undefined` = baris tidak bisa dibuka (tanpa hover, ikon). */
  getRowHref?: (item: T) => string | undefined;
  /** Nama tautan baris, mis. "Ubah Andreas Sitanggang". */
  getRowLabel?: (item: T) => string;
  /** Dipanggil sebelum pindah — mis. menandai baris untuk sorotan kembali. */
  onRowOpen?: (item: T) => void;
  /**
   * Ikon di ujung baris yang bisa dibuka (mis. pensil). Hanya penanda: klik
   * di atasnya jatuh ke tautan baris, jadi tidak ada tautan kedua yang
   * menambah perhentian Tab dan dibacakan dua kali.
   */
  rowIcon?: ReactNode;
};

/** "1–10 dari 12". Kosong bila belum ada data. */
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
  label: `${limit} / halaman`,
}));

/**
 * Tabel daftar desktop: dipakai `DataList` (prop `table`) saat paginasinya
 * bernomor. `DataList` tetap pemilik keadaan (memuat, kosong, galat,
 * menyegarkan) dan sorotan baris; komponen ini hanya bentuk isinya.
 *
 * Kenapa bukan `DashboardTable`: tabel itu berukuran kartu dashboard dan
 * tidak punya keadaan, kepala yang menempel, baris yang bisa ditandai untuk
 * sorotan kembali (`data-row-id`), maupun kaki paginasi. Bahasanya sama —
 * kepala 10px kapital, baris dipisah garis, seluruh baris satu tautan yang
 * diregangkan. Hover = bidang putih (`bg-card`): `muted` di tema ini sama dengan kanvas, jadi tidak terlihat.
 *
 * `role="table"` di atas grid CSS, bukan `<table>`: tautan yang diregangkan
 * butuh `position: relative` pada baris, dan kepala yang menempel butuh
 * `position: sticky` pada grup kepala — keduanya dukungan `<tr>`/`<thead>`
 * yang tidak merata.
 */
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
  /** Baris kerangka di ujung tabel saat halaman berikutnya dimuat (tablet). */
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
        {/*
          Kepala menempel di atas saat halaman digulir. Bidangnya kanvas 40%
          + blur 12px, selebar baris (termasuk yang menjorok): menutupi baris yang
          lewat di bawahnya, tapi gradasi aurora di belakangnya tetap tembus,
          jadi kepala tidak terbaca sebagai pita polos di atas latar.
        */}
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

/**
 * Kaki tabel: "1–10 dari 12" di kiri, pager dan jumlah baris per halaman di
 * kanan. Pager hanya bila lebih dari satu halaman; keterangannya selalu.
 */
export function DataTableFooter({
  pagination,
}: {
  pagination: Extract<DataListPagination, { mode: "pages" }>;
}) {
  const { page, totalPage, totalData, limit, onPickPage, onPickLimit } =
    pagination;

  return (
    <div className="flex min-h-12 items-center gap-3 px-gutter pt-3">
      {totalData !== undefined && limit !== undefined ? (
        <p className="text-muted-foreground text-caption tabular-nums">
          {getRangeLabel(page, limit, totalData)}
        </p>
      ) : null}

      <div className="ml-auto flex items-center gap-3">
        {totalPage > 1 ? (
          <DataListPager
            page={page}
            totalPage={totalPage}
            onPickPage={onPickPage}
            className="mt-0 px-0"
          />
        ) : null}

        {onPickLimit && limit !== undefined ? (
          <SelectField
            value={String(limit)}
            onValueChange={(value) => onPickLimit(Number(value))}
            options={LIMIT_OPTIONS}
            aria-label="Jumlah baris per halaman"
            className="w-36"
          />
        ) : null}
      </div>
    </div>
  );
}

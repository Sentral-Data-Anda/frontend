/**
 * CSV yang terbuka benar di Excel berlokal Indonesia.
 *
 * Tiga hal yang membuat berkas pemeriksaan jadi tidak bisa dipakai, dan
 * ketiganya ditangani di sini:
 *
 * 1. Pemisah kolom. Excel memakai pemisah daftar milik sistem; di lokal
 *    Indonesia itu titik koma, dan berkas berkoma mendarat utuh di satu kolom.
 * 2. Pemisah desimal. Lokal yang sama membaca koma sebagai desimal, jadi angka
 *    ditulis `1250,5` — bukan `1250.5`, yang akan terbaca sebagai teks.
 * 3. Nol di depan. Excel memangkas `0101` jadi `101`. Hanya nilai yang
 *    seluruhnya angka dan berawalan nol yang dibungkus rumus, supaya berkasnya
 *    tetap enak dibaca di tempat lain.
 */

const SEPARATOR = ";";

/** Excel membaca UTF-8 hanya bila berkasnya diawali BOM. */
const BOM = "﻿";

const LEADING_ZERO = /^0\d+$/;

/**
 * Karakter yang membuat Excel memperlakukan sebuah sel sebagai rumus.
 *
 * Mengutip tidak menolongnya: tanda kutip dibuang saat berkasnya dibuka, lalu
 * isinya dijalankan. Keterangan, referensi, dan nama akun semuanya diketik
 * pengguna, jadi satu keterangan yang diawali "=" akan berjalan di komputer
 * siapa pun yang membuka hasil ekspornya.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

const quote = (text: string) => `"${text.replace(/"/g, '""')}"`;

/** Membuat sel dibaca sebagai teks, bukan rumus, tanpa mengubah isinya. */
const defuse = (text: string) => (FORMULA_START.test(text) ? `'${text}` : text);

export const csvCell = (value: string | number): string => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value).replace(".", ",") : "";
  }

  // Satu-satunya rumus yang boleh ditulis adalah yang dibuat di sini, dari
  // nilai yang sudah terbukti hanya angka.
  return LEADING_ZERO.test(value)
    ? quote(`=${quote(value)}`)
    : quote(defuse(value));
};

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

export function toCsv<T>(
  columns: readonly CsvColumn<T>[],
  rows: readonly T[],
): string {
  const lines = [
    columns.map((column) => csvCell(column.header)).join(SEPARATOR),
    ...rows.map((row) =>
      columns.map((column) => csvCell(column.value(row))).join(SEPARATOR),
    ),
  ];

  return BOM + lines.join("\r\n");
}

/** Nama berkas yang aman di ketiga sistem berkas, tanpa membuang artinya. */
export const csvFileName = (parts: readonly string[]) =>
  `${parts
    .map((part) => part.trim().replace(/[^\w.-]+/g, "-"))
    .filter(Boolean)
    .join("_")}.csv`;

export function onDownloadCsv(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

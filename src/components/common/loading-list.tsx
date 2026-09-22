/**
 * Garis antar-baris daftar: `border-t` pada badan baris (`data-slot=
 * "row-body"`) kedua dst. Badan baris mulai setelah `leading` dan berakhir di
 * padding kanan, jadi garisnya inset di kedua sisi tanpa angka yang harus ikut
 * diubah saat `leading` berganti ukuran. Dipakai `DataList` dan skeleton ini
 * supaya garisnya identik.
 */
export const LIST_DIVIDER = "[&>li+li>[data-slot=row-body]]:border-t";

/**
 * Baris skeleton saja, tanpa `<ul>`: `DataList` menyisipkannya di ujung daftar
 * yang sudah ada saat memuat halaman berikutnya, supaya garis pemisahnya ikut
 * `LIST_DIVIDER` yang sama. `aria-hidden` karena bukan data — keadaan memuat
 * dikabarkan lewat teks, bukan lewat baris kosong yang dibacakan satu-satu.
 *
 * Tingginya dipatok 56px per baris dan susunannya (lingkaran 36px, badan
 * bergaris) sama dengan `DataListRow` + `Avatar tone="soft"`. Kalau berbeda,
 * daftar akan melompat saat data tiba, dan lompatan itu terbaca sebagai
 * kedipan.
 */
export function LoadingRows({ rows }: { rows: number }) {
  // key={index} adalah sah DI SINI: skeleton rows tidak punya identitas unik
  // dari data, dan urutannya tidak pernah berubah.
  return Array.from({ length: rows }, (_, index) => (
    <li
      key={index}
      aria-hidden
      className="flex h-14 items-center gap-3 px-gutter"
    >
      <span className="bg-primary-200 size-9 shrink-0 animate-pulse rounded-full" />

      <span
        data-slot="row-body"
        className="flex flex-1 flex-col justify-center gap-1.5 self-stretch border-border"
      >
        <span className="bg-primary-200 block h-3 w-2/5 animate-pulse rounded" />
        <span className="bg-primary-200 block h-2.5 w-1/4 animate-pulse rounded" />
      </span>
    </li>
  ));
}

/** Skeleton daftar, rata di kanvas seperti `DataList`. */
export function LoadingList({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true">
      <ul className={LIST_DIVIDER}>
        <LoadingRows rows={rows} />
      </ul>

      <span className="sr-only">Memuat daftar…</span>
    </div>
  );
}

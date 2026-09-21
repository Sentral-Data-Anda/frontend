/**
 * Garis antar-baris daftar: `border-t` pada badan baris (`data-slot=
 * "row-body"`) kedua dst. Badan baris mulai setelah `leading` dan berakhir di
 * padding kanan, jadi garisnya inset di kedua sisi tanpa angka yang harus ikut
 * diubah saat `leading` berganti ukuran. Dipakai `DataList` dan skeleton ini
 * supaya garisnya identik.
 */
export const LIST_DIVIDER = "[&>li+li>[data-slot=row-body]]:border-t";

/**
 * Skeleton daftar, tanpa bingkai — `DataListFrame` yang memberinya kartu.
 *
 * Tingginya dipatok 56px per baris dan susunannya (lingkaran 36px, badan
 * bergaris) sama dengan `DataListRow` + `Avatar tone="soft"`. Kalau berbeda,
 * daftar akan melompat saat data tiba, dan lompatan itu terbaca sebagai
 * kedipan.
 */
export function LoadingList({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true">
      <ul className={LIST_DIVIDER}>
        {/* key={index} adalah sah DI SINI: skeleton rows tidak punya identitas
            unik dari data, dan urutannya tidak pernah berubah. */}
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className="flex h-14 items-center gap-3 px-gutter">
            <span className="bg-primary-100 size-9 shrink-0 animate-pulse rounded-full" />

            <span
              data-slot="row-body"
              className="flex flex-1 flex-col justify-center gap-1.5 self-stretch border-border"
            >
              <span className="bg-primary-100 block h-3 w-2/5 animate-pulse rounded" />
              <span className="bg-primary-100 block h-2.5 w-1/4 animate-pulse rounded" />
            </span>
          </li>
        ))}
      </ul>

      <span className="sr-only">Memuat daftar…</span>
    </div>
  );
}

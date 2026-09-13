/**
 * Bentuk respons be-sada, apa adanya.
 *
 * Sebelumnya berkas ini mendeklarasikan `Paginated<T>` dengan
 * `meta: { page, perPage, total, totalPages }`. Bentuk itu tidak pernah
 * dikirim be-sada dan diganti sebelum ada layar yang memakainya.
 */

/** Amplop sukses. Dipakai SELURUH endpoint. */
export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

/**
 * Amplop daftar. `totalData` dan `totalPage` berada DI LEVEL AMPLOP, bukan di
 * dalam objek `meta` — lihat `jemaat.controller.ts` di be-sada.
 */
export type ApiListResponse<T> = ApiResponse<T[]> & {
  totalData: number;
  totalPage: number;
};

/**
 * Amplop gagal. Perhatikan bahwa field pesannya `error`, BUKAN `message`:
 * `errorHandler.ts` di be-sada memakai nama itu di setiap cabangnya. Satu-satunya
 * tempat perbedaan ini boleh diurus adalah `readErrorMessage` di
 * `src/lib/api/fetcher.ts`.
 */
export type ApiErrorBody = {
  status: number;
  error: string;
};

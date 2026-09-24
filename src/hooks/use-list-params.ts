"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

import { saveListReturn } from "@/lib/list-return";

/** Sama dengan `DEFAULT_PAGE_SIZE` di `be-sada/src/common/utils/query.ts`. */
export const DEFAULT_LIMIT = 10;

/**
 * Nama parameter FE dan nama parameter be-sada TIDAK sama, dan itu disengaja.
 *
 * Di URL aplikasi orang membaca `?search=budi` — itu yang bisa dibagikan dan
 * dibaca manusia. be-sada menamainya `filter`
 * (`jemaat.service.ts:findAllWithPagination`). Penerjemahannya terjadi SEKALI
 * di `toApiQuery` di bawah, bukan di 61 layar: begitu satu layar menulis
 * `?filter=` sendiri, layar berikutnya akan menyalinnya, dan URL aplikasi
 * pelan-pelan jadi cerminan skema backend alih-alih milik user.
 */
export type ListParams = {
  page: number;
  limit: number;
  search: string;
  status: string;
  /** Nilai filter skema, berkunci nama parameter be-sada (mis. `zone`). */
  apiFilters?: Record<string, string>;
};

/**
 * Filter tambahan per layar (list-state.md §2.5): kunci = nama di URL
 * aplikasi (`?wilayah=`), `api` = nama parameter be-sada (`zone`). Dibaca dan
 * ditulis di sini saja; layar tidak pernah menulis nama parameter be-sada.
 *
 * ponytail: hanya teks bebas. `date()`/`enumOf()` di §2.5 ditambahkan saat
 * layar pertama yang butuh rentang tanggal atau urutan datang.
 */
export type ListFilterSchema = Record<string, { api: string }>;

const NO_FILTERS: ListFilterSchema = {};

const onReadNumber = (value: string | null, fallback: number): number => {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/** Query string untuk be-sada. Satu-satunya tempat `search` menjadi `filter`. */
export function toApiQuery(params: ListParams): string {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search) query.set("filter", params.search);
  if (params.status) query.set("status", params.status);

  for (const [api, value] of Object.entries(params.apiFilters ?? {})) {
    if (value) query.set(api, value);
  }

  return query.toString();
}

/**
 * Filter dan paginasi hidup di URL, bukan di state komponen (D12).
 *
 * Konsekuensinya yang membuat ini sepadan: tombol back mengembalikan halaman
 * dan kata kunci sebelumnya, hasil pencarian bisa dibagikan sebagai tautan,
 * dan refresh tidak melempar user kembali ke halaman 1.
 *
 * `router.replace`, bukan `push`: mengetik "budi" huruf demi huruf tidak boleh
 * menyisakan empat entri riwayat yang harus ditekan back empat kali.
 */
export function useListParams({
  limit: limitPerPage = DEFAULT_LIMIT,
  filters: schema = NO_FILTERS,
}: {
  limit?: number;
  /** Konstanta modul, bukan objek baru tiap render (dipakai `useMemo`). */
  filters?: ListFilterSchema;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(() => {
    const filters = Object.fromEntries(
      Object.keys(schema).map((key) => [key, searchParams.get(key) ?? ""]),
    );

    return {
      page: onReadNumber(searchParams.get("page"), 1),
      limit: onReadNumber(searchParams.get("limit"), limitPerPage),
      search: searchParams.get("search") ?? "",
      status: searchParams.get("status") ?? "",
      /** Nilai filter skema, berkunci nama di URL (mis. `wilayah`). */
      filters,
      apiFilters: Object.fromEntries(
        Object.entries(schema).map(([key, { api }]) => [api, filters[key]]),
      ),
    } satisfies ListParams & { filters: Record<string, string> };
  }, [limitPerPage, schema, searchParams]);

  /**
   * Jalan kembali dari layar detail (list-state.md §2.2, L-2): satu efek di
   * sini, bukan satu pemanggilan di tiap layar daftar — kalau tidak, layar ke
   * 61 akan lupa dan tombol kembalinya membuang filter user.
   *
   * Ditulis pada setiap perubahan parameter, termasuk saat daftar pertama
   * dibuka: yang disimpan adalah keadaan terakhir daftar, apa pun rutenya
   * menuju detail.
   */
  const query = searchParams.toString();

  useEffect(() => {
    saveListReturn(pathname, query ? `${pathname}?${query}` : pathname);
  }, [pathname, query]);

  /**
   * Query string dibaca dari `window.location.search`, BUKAN dari
   * `searchParams` hasil hook.
   *
   * Dua alasan, dan yang kedua yang menentukan bentuk berkas ini. Pertama,
   * `location` selalu yang termutakhir; `searchParams` bisa tertinggal satu
   * render di belakang `router.replace` yang baru saja dipanggil, dan dua
   * perubahan yang datang berdekatan lalu saling menimpa. Kedua, dependency-nya
   * jadi `[pathname, router]` yang keduanya stabil — sehingga `onSearch`,
   * `onPickStatus`, dan `onPickPage` juga stabil. Kalau tidak, `SearchInput`
   * harus menyimpan callback-nya di ref supaya timer jedanya tidak disetel
   * ulang pada setiap render induk.
   *
   * Aman di server karena fungsi ini hanya dipanggil dari event handler dan
   * timer, tidak pernah saat render.
   */
  const onWrite = useCallback(
    (next: Partial<ListParams>) => {
      const url = new URLSearchParams(window.location.search);

      for (const [key, value] of Object.entries(next)) {
        const text = String(value);

        // Nilai kosong dan halaman 1 dihapus, bukan ditulis. URL setelah
        // mengosongkan kotak cari harus kembali bersih seperti semula —
        // `?search=&page=1` terlihat seperti aplikasi yang bocor.
        if (
          !value ||
          (key === "page" && value === 1) ||
          (key === "limit" && value === limitPerPage)
        )
          url.delete(key);
        else url.set(key, text);
      }

      const query = url.toString();

      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [limitPerPage, pathname, router],
  );

  /**
   * Mengubah kata kunci atau filter WAJIB mengembalikan ke halaman 1. Tanpa
   * itu, mencari dari halaman 3 menghasilkan daftar kosong walau datanya ada —
   * kegagalan yang terbaca sebagai "pencariannya rusak".
   */
  const onSearch = useCallback(
    (search: string) => onWrite({ search, page: 1 }),
    [onWrite],
  );

  const onPickStatus = useCallback(
    (status: string) => onWrite({ status, page: 1 }),
    [onWrite],
  );

  /** Hanya dipakai pager desktop; di mobile `page` URL diabaikan (lihat `useListQuery`). */
  const onPickPage = useCallback(
    (page: number) => onWrite({ page }),
    [onWrite],
  );

  /** Jumlah baris per halaman (kaki tabel desktop). Kembali ke halaman 1. */
  const onPickLimit = useCallback(
    (limit: number) => onWrite({ limit, page: 1 }),
    [onWrite],
  );

  /** Filter skema mana pun; seperti cari dan status, kembali ke halaman 1. */
  const onPickFilter = useCallback(
    (key: string, value: string) => onWrite({ [key]: value, page: 1 }),
    [onWrite],
  );

  return {
    ...params,
    onSearch,
    onPickStatus,
    onPickPage,
    onPickLimit,
    onPickFilter,
  };
}

export type ListState = ReturnType<typeof useListParams>;

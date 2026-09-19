"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchList } from "@/lib/api/fetcher";

import type { JemaatListItem } from "./types";

/**
 * Kunci query disusun di satu tempat, bukan ditulis inline di hook.
 *
 * Invalidasi setelah tambah/ubah/hapus (Fase 3b) harus menyebut kunci yang
 * SAMA PERSIS dengan yang dipakai daftar ini. Dua literal array yang ditulis
 * di dua berkas akan berbeda suatu saat, dan gejalanya bukan galat melainkan
 * daftar yang tidak ikut berubah setelah menyimpan.
 */
export const jemaatKeys = {
  all: ["jemaat"] as const,
  list: (query: string) => [...jemaatKeys.all, "list", query] as const,
};

/**
 * Daftar jemaat.
 *
 * `query` sudah berupa query string untuk be-sada (`toApiQuery` di
 * `useListParams` yang menerjemahkan `search` → `filter`). Ia dipakai apa
 * adanya sebagai bagian kunci cache: dua kombinasi filter yang berbeda adalah
 * dua daftar yang berbeda, dan stringnya sudah ternormalisasi.
 *
 * `keepPreviousData` adalah yang membuat paginasi dan pencarian terasa tenang:
 * tanpa itu, setiap perubahan kunci mengosongkan `data` dan daftar runtuh jadi
 * skeleton di antara dua halaman. `DataList` memakai `isFetching` untuk
 * meredupkan daftar lama alih-alih menghapusnya.
 *
 * Yang TIDAK ditulis di sini, karena `providers.tsx` sudah mengaturnya untuk
 * seluruh aplikasi: `staleTime`, kebijakan `retry` yang menolak 4xx, dan
 * `refetchOnWindowFocus`.
 */
export function useJemaatList(query: string) {
  return useQuery({
    queryKey: jemaatKeys.list(query),
    queryFn: () => fetchList<JemaatListItem>(`/jemaat?${query}`),
    placeholderData: keepPreviousData,
  });
}

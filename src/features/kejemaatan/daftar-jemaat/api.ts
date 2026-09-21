"use client";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList } from "@/lib/api/fetcher";

import type { JemaatListItem } from "./types";

/**
 * Kunci query disusun di satu tempat, bukan ditulis inline di hook.
 *
 * Invalidasi setelah tambah/ubah/hapus (Fase 3b) harus menyebut kunci yang
 * SAMA PERSIS dengan yang dipakai daftar ini. Dua literal array yang ditulis
 * di dua berkas akan berbeda suatu saat, dan gejalanya bukan galat melainkan
 * daftar yang tidak ikut berubah setelah menyimpan. Invalidasi `lists()`
 * mengenai daftar berhalaman (desktop) dan daftar bertumpuk (mobile) sekaligus.
 */
export const jemaatKeys = {
  all: ["jemaat"] as const,
  lists: () => [...jemaatKeys.all, "list"] as const,
};

/**
 * Daftar jemaat. Mode ambil (berhalaman vs bertumpuk), kunci per filter, dan
 * `keepPreviousData` diurus `useListQuery`; di sini hanya alamat dan tipenya.
 *
 * Yang TIDAK ditulis di sini, karena `providers.tsx` sudah mengaturnya untuk
 * seluruh aplikasi: `staleTime`, kebijakan `retry` yang menolak 4xx, dan
 * `refetchOnWindowFocus`.
 */
export function useJemaatList(params: ListState) {
  return useListQuery({
    queryKey: jemaatKeys.lists(),
    fetchPage: (apiQuery) => fetchList<JemaatListItem>(`/jemaat?${apiQuery}`),
    params,
  });
}

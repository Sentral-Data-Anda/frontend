"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { JemaatListItem, JemaatPayload } from "./types";

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
  detail: (code: string) => [...jemaatKeys.all, "detail", code] as const,
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

/**
 * Simpan jemaat: `POST` bila `code` kosong, `PUT` ke kode itu bila ada.
 *
 * Satu hook untuk dua mode karena payload dan penanganan galatnya identik;
 * yang berbeda hanya alamat dan kata kerjanya. Layar form karena itu tidak
 * punya percabangan "tambah atau ubah" di jalur simpannya.
 *
 * Invalidasi memakai AWALAN `lists()`, bukan satu kunci halaman: daftar
 * berhalaman (desktop) dan daftar bertumpuk (mobile) punya kunci berbeda, dan
 * menyegarkan satu saja berarti baris baru tidak muncul di separuh perangkat.
 */
export function useSaveJemaat(code?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: JemaatPayload) =>
      fetchOne<{ code: string }>(code ? `/jemaat/${code}` : "/jemaat", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: jemaatKeys.lists() }),
  });
}

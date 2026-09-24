"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type {
  DdlOption,
  JemaatDetail,
  JemaatListItem,
  JemaatPayload,
} from "./types";

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
 * Kandidat kembaran, memakai endpoint daftar yang SUDAH ADA — tidak ada
 * endpoint baru untuk ini, dan tidak perlu: `GET /jemaat` sudah mengembalikan
 * `name` dan `birthDate` tiap baris.
 *
 * `enabled` menunggu nama DAN tanggal lahir terisi: mencari dengan salah
 * satunya saja menarik daftar panjang yang tidak bisa menyimpulkan apa pun.
 */
export function useJemaatDuplicates(name: string, birthDate: string) {
  return useQuery({
    queryKey: [...jemaatKeys.lists(), "duplikat", name],
    queryFn: () =>
      fetchList<JemaatListItem>(
        `/jemaat?filter=${encodeURIComponent(name.trim())}&limit=5`,
      ),
    enabled: Boolean(name.trim() && birthDate),
    staleTime: 60_000,
    select: (response) => response.data,
  });
}

/**
 * Detail satu jemaat, untuk mengisi form ubah.
 *
 * Kuncinya `code` (`JMT-…`), bukan `publicId`: itu satu-satunya pengenal yang
 * dikirim endpoint daftar, dan rute ubah dibuka dari sana.
 *
 * `staleTime: 0` — form ubah harus berangkat dari nilai yang benar-benar ada
 * di server saat ini. Data 30 detik yang lalu berarti dua petugas bisa
 * saling menimpa tanpa satu pun melihat perubahan yang lain.
 */
export function useJemaatDetail(code: string | undefined) {
  return useQuery({
    queryKey: jemaatKeys.detail(code ?? ""),
    queryFn: () => fetchOne<JemaatDetail>(`/jemaat/${code}`),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
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

/**
 * Daftar pilihan `GET /api/v1/ddl/*`.
 *
 * Tiga hal yang membuat hook ini ada, dan ketiganya berlaku untuk SEMUA form
 * berikutnya — bukan hanya jemaat:
 *
 * 1. **404 berarti daftar kosong, bukan galat.** `fetchList` sudah
 *    menerjemahkannya, jadi kontrolnya menampilkan keadaan kosong, bukan layar
 *    merah.
 * 2. **Bertingkat.** `path` bernilai `null` selama tingkat di atasnya belum
 *    dipilih; `enabled` menahan permintaannya, sehingga tidak ada panggilan
 *    `regencies?provincesCode=` tanpa provinsi.
 * 3. **Nilainya berbeda per endpoint.** Alamat memakai `code` (string),
 *    relasi lain memakai `id`. Menebaknya di layar adalah cara `professionId`
 *    terisi kode dan gagal diam-diam di server.
 *
 * `staleTime` 10 menit: daftar provinsi dan pekerjaan tidak berubah selama
 * satu sesi pengisian, dan form ini membuka delapan daftar sekaligus.
 */
export const ddlKeys = {
  all: ["ddl"] as const,
  list: (path: string) => [...ddlKeys.all, path] as const,
};

export function useDdlOptions(
  path: string | null,
  valueKey: "id" | "code" = "id",
) {
  const query = useQuery({
    queryKey: ddlKeys.list(path ?? ""),
    queryFn: () => fetchList<DdlOption>(`/ddl/${path}`),
    enabled: path !== null,
    staleTime: 10 * 60_000,
    select: (response) =>
      response.data.map((row) => ({
        value: String(row[valueKey]),
        label: row.name,
      })),
  });

  return {
    options: query.data ?? [],
    // `isFetching`, bukan `isLoading`: saat provinsi diganti, kunci query
    // kabupaten berganti dan daftar lama masih tersimpan — tanpa ini kontrol
    // sempat menampilkan kabupaten provinsi sebelumnya sebagai pilihan.
    isLoading: query.isFetching,
  };
}

/**
 * Pilihan filter wilayah daftar: "Semua wilayah" lalu nama wilayah urut
 * abjad. `ddl/zone-church` mengirimnya urut `id`, bukan nama (B15).
 */
export function useZoneFilterOptions() {
  const zones = useDdlOptions("zone-church");

  return {
    ...zones,
    options: [
      { value: "", label: "Semua wilayah" },
      ...[...zones.options].sort((a, b) =>
        a.label.localeCompare(b.label, "id"),
      ),
    ],
  };
}

/**
 * Daftar keluarga dengan pencarian DI SERVER (`?filter=&limit=20`).
 *
 * `ddl/keluarga` mengirim seluruh tabel — ratusan baris hari ini, ribuan
 * setelah migrasi data, di jaringan ponsel petugas. Penyaringan sisi klien
 * tetap mengunduh semuanya dulu, jadi yang dipakai adalah `?filter=` yang
 * sekarang diterima be-sada.
 *
 * Jeda 300ms, sama dengan `SearchInput`: tanpa itu mengetik "Sitanggang"
 * mengirim sepuluh permintaan. `limit=20` karena popup tidak pernah
 * menampilkan lebih dari itu sekaligus; yang ke-21 dicari dengan mengetik
 * lebih spesifik, bukan dengan menggulir.
 */
export function useKeluargaOptions() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    if (query === debounced) return;

    const timer = setTimeout(() => setDebounced(query), 300);

    return () => clearTimeout(timer);
  }, [query, debounced]);

  const ddl = useDdlOptions(
    `keluarga?limit=20${debounced ? `&filter=${encodeURIComponent(debounced)}` : ""}`,
  );

  return { ...ddl, onSearch: setQuery };
}

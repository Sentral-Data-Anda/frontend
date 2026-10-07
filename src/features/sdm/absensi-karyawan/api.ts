"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListFilterSchema, ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { MONTH_ALL, toAbsensiApiFilters } from "./model";
import type { AbsensiKaryawan, AbsensiKaryawanPayload } from "./types";

const pathOf = (publicId: string) =>
  `/absensi-karyawan/${encodeURIComponent(publicId)}`;

export const absensiKeys = {
  all: ["absensi-karyawan"] as const,
  lists: () => [...absensiKeys.all, "list"] as const,
  detail: (publicId: string) =>
    [...absensiKeys.all, "detail", publicId] as const,
};

// `status` sudah jadi parameter bawaan `useListParams`, jadi ia tidak diulang
// di sini; rentang tanggal diturunkan dari `bulan` lewat `toAbsensiApiFilters`.
export const ABSENSI_FILTERS = {
  karyawan: { api: "karyawanId" },
  // URL kosong = bulan ini, yang menyaring; yang tidak menyaring adalah
  // "semua", jadi itulah bawaan yang dibandingkan tombol Filter.
  bulan: { api: "bulan", defaultValue: MONTH_ALL },
} satisfies ListFilterSchema;

export function useAbsensiList(params: ListState) {
  return useListQuery({
    queryKey: absensiKeys.lists(),
    fetchPage: (apiQuery) =>
      fetchList<AbsensiKaryawan>(`/absensi-karyawan?${apiQuery}`),
    params: { ...params, apiFilters: toAbsensiApiFilters(params.filters) },
  });
}

export function useAbsensiDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: absensiKeys.detail(publicId ?? ""),
    queryFn: () => fetchOne<AbsensiKaryawan>(pathOf(publicId ?? "")),
    enabled: Boolean(publicId),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidateAbsensi(publicId: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: absensiKeys.lists() }),
      // Tanpa refetch: form yang masih terpasang akan membaca 404 sesudah hapus.
      queryClient.invalidateQueries({
        queryKey: absensiKeys.detail(publicId ?? ""),
        refetchType: "none",
      }),
    ]);
}

export function useSaveAbsensi(publicId?: string) {
  const onInvalidate = useInvalidateAbsensi(publicId);

  return useMutation({
    mutationFn: (payload: AbsensiKaryawanPayload) =>
      fetchOne<AbsensiKaryawan>(
        publicId ? pathOf(publicId) : "/absensi-karyawan",
        {
          method: publicId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: onInvalidate,
  });
}

export function useDeleteAbsensi(publicId: string | undefined) {
  const onInvalidate = useInvalidateAbsensi(publicId);

  return useMutation({
    mutationFn: () =>
      fetchOne<unknown>(pathOf(publicId ?? ""), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

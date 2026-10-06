"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { Cuti, CutiPayload, HolidayDay, RemainingQuota } from "./types";

const pathOf = (code: string, suffix = "") =>
  `/cuti/${encodeURIComponent(code)}${suffix}`;

export const cutiKeys = {
  all: ["cuti"] as const,
  lists: () => [...cutiKeys.all, "list"] as const,
  detail: (code: string) => [...cutiKeys.all, "detail", code] as const,
  quota: (karyawanId: string, leaveTypeId: string, year: string) =>
    [...cutiKeys.all, "quota", karyawanId, leaveTypeId, year] as const,
  holidays: (from: string, to: string) =>
    ["hari-libur", "kalender", from, to] as const,
};

export function useCutiList(params: ListState) {
  return useListQuery({
    queryKey: cutiKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Cuti>(`/cuti?${apiQuery}`),
    params,
  });
}

export function useCutiDetail(code: string | undefined) {
  return useQuery({
    queryKey: cutiKeys.detail(code ?? ""),
    queryFn: () => fetchOne<Cuti>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

/**
 * Sisa jatah datang dari `sumDaysInYear` yang sama dengan jalur tulis, sudah
 * di-floor di 0 oleh `remainingDays` be-sada. Layar tidak menghitung ulang:
 * angka yang berbeda dari penegakannya lebih buruk daripada tanpa angka.
 *
 * `year` SELALU dikirim, dan selalu tahun MULAI permintaannya. Tanpa ia
 * be-sada jatuh ke tahun berjalan, sementara setiap permintaan dibebankan ke
 * tahun mulainya — jadi cuti Januari yang disusun bulan Desember akan
 * menampilkan sisa tahun ini lalu ditolak atas sisa tahun depan. Ia juga masuk
 * `queryKey`: tanpa itu dua tahun berbagi satu entri cache.
 */
export function useRemainingQuota(
  karyawanId: string,
  leaveTypeId: string,
  year: string,
) {
  return useQuery({
    queryKey: cutiKeys.quota(karyawanId, leaveTypeId, year),
    queryFn: () =>
      fetchOne<RemainingQuota>(
        `/cuti/sisa-jatah?karyawanId=${encodeURIComponent(karyawanId)}&leaveTypeId=${encodeURIComponent(leaveTypeId)}&year=${encodeURIComponent(year)}`,
      ),
    enabled: Boolean(karyawanId && leaveTypeId && year),
    staleTime: 0,
    select: (response) => response.data,
  });
}

/**
 * `GET /hari-libur/kalender` ada di `SELF_SERVICE`: setiap sesi boleh
 * membacanya tanpa `HARI_LIBUR` VIEW, dan ia sudah memekarkan `isRecurring`
 * di server — ekspansi kedua di klien adalah kalender kedua yang bisa beda.
 */
export function useHolidayCalendar(from: string, to: string) {
  return useQuery({
    queryKey: cutiKeys.holidays(from, to),
    queryFn: () =>
      fetchList<HolidayDay>(
        `/hari-libur/kalender?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      ),
    enabled: Boolean(from && to && to >= from),
    staleTime: 10 * 60_000,
    select: (response) => response.data,
  });
}

function useInvalidateCuti(code: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: cutiKeys.lists() }),
      queryClient.invalidateQueries({
        queryKey: cutiKeys.detail(code ?? ""),
        refetchType: "none",
      }),
      queryClient.invalidateQueries({
        queryKey: [...cutiKeys.all, "quota"],
        refetchType: "none",
      }),
    ]);
}

export function useSaveCuti(code?: string) {
  const onInvalidate = useInvalidateCuti(code);

  return useMutation({
    mutationFn: (payload: CutiPayload) =>
      fetchOne<Cuti>(code ? pathOf(code) : "/cuti", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export type CutiAction = "pengajuan" | "batal" | "hapus";

const REQUEST: Record<CutiAction, { method: string; suffix: string }> = {
  pengajuan: { method: "POST", suffix: "/pengajuan" },
  batal: { method: "PUT", suffix: "/batal" },
  hapus: { method: "DELETE", suffix: "" },
};

export function useCutiAction(code: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: CutiAction) =>
      fetchOne<unknown>(pathOf(code ?? "", REQUEST[action].suffix), {
        method: REQUEST[action].method,
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: cutiKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: cutiKeys.detail(code ?? ""),
        }),
        queryClient.invalidateQueries({ queryKey: [...cutiKeys.all, "quota"] }),
      ]),
  });
}

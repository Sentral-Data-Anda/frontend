"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type {
  FiscalPeriod,
  FiscalPeriodDetail,
  OpenYearPayload,
  ReopenPayload,
} from "./types";

export const fiscalPeriodKeys = {
  all: ["fiscal-period"] as const,
  lists: () => [...fiscalPeriodKeys.all, "list"] as const,
  years: () => [...fiscalPeriodKeys.all, "years"] as const,
  detail: (id: string) => [...fiscalPeriodKeys.all, "detail", id] as const,
};

const JOURNAL_KEY = ["journal"] as const;

const pathOf = (id: string) => `/periode-fiskal/${encodeURIComponent(id)}`;

export function useFiscalPeriodList(params: ListState) {
  return useListQuery({
    queryKey: fiscalPeriodKeys.lists(),
    fetchPage: (apiQuery) =>
      fetchList<FiscalPeriod>(`/periode-fiskal?${apiQuery}`),
    params,
  });
}

// Tahun yang tersedia diturunkan dari satu bacaan 100 baris: cukup untuk delapan tahun buku.
export function usePeriodYears(isEnabled: boolean) {
  return useQuery({
    queryKey: fiscalPeriodKeys.years(),
    queryFn: () => fetchList<FiscalPeriod>("/periode-fiskal?page=1&limit=100"),
    enabled: isEnabled,
    select: (response) => [...new Set(response.data.map((row) => row.year))],
  });
}

export function useFiscalPeriod(id: string | undefined) {
  return useQuery({
    queryKey: fiscalPeriodKeys.detail(id ?? ""),
    queryFn: () => fetchOne<FiscalPeriodDetail>(pathOf(id ?? "")),
    enabled: Boolean(id),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidatePeriod() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: fiscalPeriodKeys.all }),
      queryClient.invalidateQueries({ queryKey: JOURNAL_KEY }),
    ]);
}

export function useOpenYear() {
  const onInvalidate = useInvalidatePeriod();

  return useMutation({
    mutationFn: (payload: OpenYearPayload) =>
      fetchOne<FiscalPeriod[]>("/periode-fiskal", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useClosePeriod(id: string) {
  const onInvalidate = useInvalidatePeriod();

  return useMutation({
    mutationFn: () =>
      fetchOne<FiscalPeriodDetail>(`${pathOf(id)}/tutup`, { method: "PUT" }),
    onSuccess: onInvalidate,
    onError: onInvalidate,
  });
}

export function useReopenPeriod(id: string) {
  const onInvalidate = useInvalidatePeriod();

  return useMutation({
    mutationFn: (payload: ReopenPayload) =>
      fetchOne<FiscalPeriodDetail>(`${pathOf(id)}/buka`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

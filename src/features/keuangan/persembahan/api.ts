"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  toApiQuery,
  type ListFilterSchema,
  type ListState,
} from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";
import type { ApiListResponse } from "@/types/api";

import { toPersembahanApiFilters } from "./model";
import type {
  Persembahan,
  PersembahanBatchPayload,
  PersembahanTotals,
} from "./types";

export const persembahanKeys = {
  all: ["persembahan"] as const,
  lists: () => [...persembahanKeys.all, "list"] as const,
  totals: (query: string) => [...persembahanKeys.all, "totals", query] as const,
  detail: (code: string) => [...persembahanKeys.all, "detail", code] as const,
};

export const PERSEMBAHAN_FILTERS = {
  bulan: { api: "bulan" },
  tipe: { api: "typePersembahanId" },
  cara: { api: "receiveMethod" },
  posting: { api: "isPosted" },
} satisfies ListFilterSchema;

const pathOf = (code: string) => `/persembahan/${encodeURIComponent(code)}`;

const listPage = (apiQuery: string) =>
  fetchList<Persembahan>(`/persembahan?${apiQuery}`);

const paramsOf = (params: ListState) => ({
  ...params,
  apiFilters: toPersembahanApiFilters(params.filters),
});

export function usePersembahanList(params: ListState) {
  return useListQuery({
    queryKey: persembahanKeys.lists(),
    fetchPage: listPage,
    params: paramsOf(params),
  });
}

/**
 * `totalAmount` milik jawaban daftar dan mengikuti saringan yang sedang aktif;
 * `useListQuery` tidak meneruskannya, jadi subjudul memintanya sendiri dengan
 * satu baris.
 */
export function usePersembahanTotals(params: ListState) {
  const query = toApiQuery({ ...paramsOf(params), page: 1, limit: 1 });

  return useQuery({
    queryKey: persembahanKeys.totals(query),
    queryFn: () => listPage(query),
    select: (response): PersembahanTotals => ({
      count: response.totalData,
      total:
        (response as ApiListResponse<Persembahan> & { totalAmount?: string })
          .totalAmount ?? "0",
    }),
  });
}

export function usePersembahanDetail(code: string | undefined) {
  return useQuery({
    queryKey: persembahanKeys.detail(code ?? ""),
    queryFn: () => fetchOne<Persembahan>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidatePersembahan() {
  const queryClient = useQueryClient();

  return (isJournalTouched = false) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: persembahanKeys.all }),
      ...(isJournalTouched
        ? [queryClient.invalidateQueries({ queryKey: ["journal"] })]
        : []),
    ]);
}

export function useSavePersembahanBatch() {
  const onInvalidate = useInvalidatePersembahan();

  return useMutation({
    mutationFn: (payload: PersembahanBatchPayload) =>
      fetchOne<Persembahan[]>("/persembahan/batch", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => onInvalidate(),
  });
}

export function useVoidPersembahan(code: string) {
  const onInvalidate = useInvalidatePersembahan();

  return useMutation({
    mutationFn: (voidReason: string) =>
      fetchOne<Persembahan>(`${pathOf(code)}/void`, {
        method: "POST",
        body: JSON.stringify({ voidReason }),
      }),
    onSuccess: () => onInvalidate(true),
  });
}

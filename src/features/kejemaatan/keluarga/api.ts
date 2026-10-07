"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { Keluarga, KeluargaPayload } from "./types";

export const keluargaKeys = {
  all: ["keluarga"] as const,
  lists: () => [...keluargaKeys.all, "list"] as const,
  detail: (code: string) => [...keluargaKeys.all, "detail", code] as const,
};

const pathOf = (key: string) => `/keluarga/${encodeURIComponent(key)}`;

export function useKeluargaList(params: ListState) {
  return useListQuery({
    queryKey: keluargaKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Keluarga>(`/keluarga?${apiQuery}`),
    params,
  });
}

export function useKeluargaDetail(code: string | undefined) {
  return useQuery({
    queryKey: keluargaKeys.detail(code ?? ""),
    queryFn: () => fetchOne<Keluarga>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useSaveKeluarga(code?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: KeluargaPayload) =>
      fetchOne<Keluarga>(code ? pathOf(code) : "/keluarga", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: keluargaKeys.lists() }),
  });
}

export function useDeleteKeluarga(code: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchOne<Keluarga>(pathOf(code ?? ""), { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: keluargaKeys.lists() }),
  });
}

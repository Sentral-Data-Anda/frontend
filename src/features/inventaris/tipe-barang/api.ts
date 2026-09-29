"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { TipeBarang, TipeBarangPayload } from "./types";

export const tipeBarangKeys = {
  all: ["type-item"] as const,
  lists: () => [...tipeBarangKeys.all, "list"] as const,
  detail: (code: string) => [...tipeBarangKeys.all, "detail", code] as const,
};

export function useTipeBarangList(params: ListState) {
  return useListQuery({
    queryKey: tipeBarangKeys.lists(),
    fetchPage: (apiQuery) => fetchList<TipeBarang>(`/type-item?${apiQuery}`),
    params: { ...params, status: "" },
  });
}

export function useTipeBarangDetail(code: string | undefined) {
  return useQuery({
    queryKey: tipeBarangKeys.detail(code ?? ""),
    queryFn: () => fetchOne<TipeBarang>(`/type-item/${code}`),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidateTipeBarang(code: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: tipeBarangKeys.lists() }),
      // Tanpa refetch: form yang masih terpasang akan membaca 404 sesudah hapus.
      queryClient.invalidateQueries({
        queryKey: tipeBarangKeys.detail(code ?? ""),
        refetchType: "none",
      }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.all,
        predicate: (query) => String(query.queryKey[1]).startsWith("type-item"),
      }),
    ]);
}

export function useSaveTipeBarang(code?: string) {
  const onInvalidate = useInvalidateTipeBarang(code);

  return useMutation({
    mutationFn: (payload: TipeBarangPayload) =>
      fetchOne<TipeBarang>(code ? `/type-item/${code}` : "/type-item", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteTipeBarang(code: string | undefined) {
  const onInvalidate = useInvalidateTipeBarang(code);

  return useMutation({
    mutationFn: () =>
      fetchOne<unknown>(`/type-item/${code}`, { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

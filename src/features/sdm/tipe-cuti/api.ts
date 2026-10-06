"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { TipeCuti, TipeCutiPayload } from "./types";

const pathOf = (code: string) => `/tipe-cuti/${encodeURIComponent(code)}`;

export const tipeCutiKeys = {
  all: ["tipe-cuti"] as const,
  lists: () => [...tipeCutiKeys.all, "list"] as const,
  detail: (code: string) => [...tipeCutiKeys.all, "detail", code] as const,
};

export function useTipeCutiList(params: ListState) {
  return useListQuery({
    queryKey: tipeCutiKeys.lists(),
    fetchPage: (apiQuery) => fetchList<TipeCuti>(`/tipe-cuti?${apiQuery}`),
    params: { ...params, status: "" },
  });
}

export function useTipeCutiDetail(code: string | undefined) {
  return useQuery({
    queryKey: tipeCutiKeys.detail(code ?? ""),
    queryFn: () => fetchOne<TipeCuti>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidateTipeCuti(code: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: tipeCutiKeys.lists() }),
      // Tanpa refetch: form yang masih terpasang akan membaca 404 sesudah hapus.
      queryClient.invalidateQueries({
        queryKey: tipeCutiKeys.detail(code ?? ""),
        refetchType: "none",
      }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.all,
        predicate: (query) => String(query.queryKey[1]).startsWith("tipe-cuti"),
      }),
    ]);
}

export function useSaveTipeCuti(code?: string) {
  const onInvalidate = useInvalidateTipeCuti(code);

  return useMutation({
    mutationFn: (payload: TipeCutiPayload) =>
      fetchOne<TipeCuti>(code ? pathOf(code) : "/tipe-cuti", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteTipeCuti(code: string | undefined) {
  const onInvalidate = useInvalidateTipeCuti(code);

  return useMutation({
    mutationFn: () =>
      fetchOne<unknown>(pathOf(code ?? ""), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { Satuan, SatuanPayload } from "./types";

export const satuanKeys = {
  all: ["unit"] as const,
  lists: () => [...satuanKeys.all, "list"] as const,
  detail: (code: string) => [...satuanKeys.all, "detail", code] as const,
};

const pathOf = (key: string) => `/unit/${encodeURIComponent(key)}`;

export function useSatuanList(params: ListState) {
  return useListQuery({
    queryKey: satuanKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Satuan>(`/unit?${apiQuery}`),
    params: { ...params, status: "" },
  });
}

export function useSatuanDetail(code: string | undefined) {
  return useQuery({
    queryKey: satuanKeys.detail(code ?? ""),
    queryFn: () => fetchOne<Satuan>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidateSatuan(code: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: satuanKeys.lists() }),
      // Tanpa refetch: form yang masih terpasang akan membaca 404 sesudah hapus.
      queryClient.invalidateQueries({
        queryKey: satuanKeys.detail(code ?? ""),
        refetchType: "none",
      }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.all,
        predicate: (query) => String(query.queryKey[1]).startsWith("unit"),
      }),
    ]);
}

export function useSaveSatuan(code?: string) {
  const onInvalidate = useInvalidateSatuan(code);

  return useMutation({
    mutationFn: (payload: SatuanPayload) =>
      fetchOne<Satuan>(code ? pathOf(code) : "/unit", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteSatuan(code: string | undefined) {
  const onInvalidate = useInvalidateSatuan(code);

  return useMutation({
    mutationFn: () =>
      fetchOne<unknown>(pathOf(code ?? ""), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

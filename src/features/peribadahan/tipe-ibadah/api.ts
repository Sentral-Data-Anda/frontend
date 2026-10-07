"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { IS_ACTIVE_PARAM } from "./model";
import type { TipeIbadah, TipeIbadahPayload } from "./types";

export const tipeIbadahKeys = {
  all: ["tipe-ibadah"] as const,
  lists: () => [...tipeIbadahKeys.all, "list"] as const,
  detail: (code: string) => [...tipeIbadahKeys.all, "detail", code] as const,
};

const IBADAH_LIST_KEY = ["ibadah", "list"] as const;

const pathOf = (key: string) => `/type-ibadah/${encodeURIComponent(key)}`;

export function useTipeIbadahList(params: ListState) {
  return useListQuery({
    queryKey: tipeIbadahKeys.lists(),
    fetchPage: (apiQuery) => fetchList<TipeIbadah>(`/type-ibadah?${apiQuery}`),
    params: {
      ...params,
      status: "",
      apiFilters: { isActive: IS_ACTIVE_PARAM[params.status] ?? "" },
    },
  });
}

export function useTipeIbadahDetail(code: string | undefined) {
  return useQuery({
    queryKey: tipeIbadahKeys.detail(code ?? ""),
    queryFn: () => fetchOne<TipeIbadah>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidateTipeIbadah(code: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: tipeIbadahKeys.lists() }),
      // Tanpa refetch: form yang masih terpasang akan membaca 404 sesudah hapus.
      queryClient.invalidateQueries({
        queryKey: tipeIbadahKeys.detail(code ?? ""),
        refetchType: "none",
      }),
      queryClient.invalidateQueries({ queryKey: ddlKeys.list("type-ibadah") }),
      queryClient.invalidateQueries({ queryKey: IBADAH_LIST_KEY }),
    ]);
}

export function useSaveTipeIbadah(code?: string) {
  const onInvalidate = useInvalidateTipeIbadah(code);

  return useMutation({
    mutationFn: (payload: TipeIbadahPayload) =>
      fetchOne<TipeIbadah>(code ? pathOf(code) : "/type-ibadah", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteTipeIbadah(code: string | undefined) {
  const onInvalidate = useInvalidateTipeIbadah(code);

  return useMutation({
    mutationFn: () =>
      fetchOne<unknown>(pathOf(code ?? ""), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

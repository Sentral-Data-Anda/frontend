"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { IS_ACTIVE_PARAM } from "./model";
import type { Wilayah, WilayahPayload } from "./types";

export const wilayahKeys = {
  all: ["wilayah"] as const,
  lists: () => [...wilayahKeys.all, "list"] as const,
  detail: (code: string) => [...wilayahKeys.all, "detail", code] as const,
};

const pathOf = (key: string) => `/zone-church/${encodeURIComponent(key)}`;

export function useWilayahList(params: ListState) {
  return useListQuery({
    queryKey: wilayahKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Wilayah>(`/zone-church?${apiQuery}`),
    params: {
      ...params,
      status: "",
      apiFilters: { isActive: IS_ACTIVE_PARAM[params.status] ?? "" },
    },
  });
}

export function useWilayahDetail(code: string | undefined) {
  return useQuery({
    queryKey: wilayahKeys.detail(code ?? ""),
    queryFn: () => fetchOne<Wilayah>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidateWilayah() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: wilayahKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: ddlKeys.list("zone-church") }),
    ]);
}

export function useSaveWilayah(code?: string) {
  const onInvalidate = useInvalidateWilayah();

  return useMutation({
    mutationFn: (payload: WilayahPayload) =>
      fetchOne<Wilayah>(code ? pathOf(code) : "/zone-church", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteWilayah(code: string | undefined) {
  const onInvalidate = useInvalidateWilayah();

  return useMutation({
    mutationFn: () =>
      fetchOne<unknown>(pathOf(code ?? ""), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

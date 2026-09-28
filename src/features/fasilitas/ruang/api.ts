"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";
import { MEDIA_REFETCH_MS } from "@/lib/attachment";

import { IS_ACTIVE_PARAM } from "./model";
import type { Room, RoomDetail, RoomUsage } from "./types";

export const ruangKeys = {
  all: ["room"] as const,
  lists: () => [...ruangKeys.all, "list"] as const,
  detail: (code: string) => [...ruangKeys.all, "detail", code] as const,
  usage: (code: string) => [...ruangKeys.all, "usage", code] as const,
};

const pathOf = (code?: string) =>
  code ? `/room/${encodeURIComponent(code)}` : "/room";

export function useRuangList(params: ListState) {
  return useListQuery({
    queryKey: ruangKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Room>(`/room?${apiQuery}`),
    params: {
      ...params,
      status: "",
      apiFilters: { isActive: IS_ACTIVE_PARAM[params.status] ?? "" },
    },
    refetchInterval: MEDIA_REFETCH_MS,
  });
}

export function useRuangDetail(code: string | undefined) {
  return useQuery({
    queryKey: ruangKeys.detail(code ?? ""),
    queryFn: () => fetchOne<RoomDetail>(pathOf(code)),
    enabled: Boolean(code),
    staleTime: 0,
    refetchInterval: MEDIA_REFETCH_MS,
    select: (response) => response.data,
  });
}

export function useRuangUsage(code: string | undefined) {
  return useQuery({
    queryKey: ruangKeys.usage(code ?? ""),
    queryFn: () => fetchList<RoomUsage>(`${pathOf(code)}/usage`),
    enabled: Boolean(code),
    select: (response) => response.data,
  });
}

// Detail yang sedang terbuka tidak di-refetch: form segera ditinggalkan, dan sesudah hapus jawabannya 404.
function useInvalidateRuang() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ruangKeys.all,
        refetchType: "none",
        predicate: (query) => query.queryKey[1] === "detail",
      }),
      queryClient.invalidateQueries({
        queryKey: ruangKeys.all,
        predicate: (query) => query.queryKey[1] !== "detail",
      }),
      queryClient.invalidateQueries({ queryKey: ddlKeys.list("room") }),
    ]);
}

export function useSaveRuang(code?: string) {
  const onInvalidate = useInvalidateRuang();

  return useMutation({
    mutationFn: (body: FormData) =>
      fetchOne<RoomDetail>(pathOf(code), {
        method: code ? "PUT" : "POST",
        body,
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteRuang(code: string | undefined) {
  const onInvalidate = useInvalidateRuang();

  return useMutation({
    mutationFn: () => fetchOne<unknown>(pathOf(code), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

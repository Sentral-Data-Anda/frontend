"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { BapelDetail, BapelListItem, BapelPayload } from "./types";

export const bapelKeys = {
  all: ["bapel"] as const,
  lists: () => [...bapelKeys.all, "list"] as const,
  detail: (code: string) => [...bapelKeys.all, "detail", code] as const,
};

export function useBapelList(params: ListState) {
  return useListQuery({
    queryKey: bapelKeys.lists(),
    fetchPage: (apiQuery) => fetchList<BapelListItem>(`/bapel?${apiQuery}`),
    params,
  });
}

export function useBapelDetail(code: string | undefined) {
  return useQuery({
    queryKey: bapelKeys.detail(code ?? ""),
    queryFn: () => fetchOne<BapelDetail>(`/bapel/${code}`),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useSaveBapel(code?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BapelPayload) =>
      fetchOne<BapelDetail>(code ? `/bapel/${code}` : "/bapel", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: bapelKeys.lists() }),
  });
}

export function useDeleteBapel(code: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fetchOne<unknown>(`/bapel/${code}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: bapelKeys.lists() }),
  });
}

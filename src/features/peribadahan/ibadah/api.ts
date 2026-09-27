"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { toIbadahApiFilters } from "./model";
import type { Ibadah, IbadahPayload, IbadahSaved } from "./types";

export const ibadahKeys = {
  all: ["ibadah"] as const,
  lists: () => [...ibadahKeys.all, "list"] as const,
  detail: (code: string) => [...ibadahKeys.all, "detail", code] as const,
};

export function useIbadahList(params: ListState) {
  return useListQuery({
    queryKey: ibadahKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Ibadah>(`/ibadah?${apiQuery}`),
    params: { ...params, apiFilters: toIbadahApiFilters(params.filters) },
  });
}

export function useIbadahDetail(code: string | undefined) {
  return useQuery({
    queryKey: ibadahKeys.detail(code ?? ""),
    queryFn: () =>
      fetchOne<Ibadah>(`/ibadah/${encodeURIComponent(code ?? "")}`),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidateIbadah(code: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ibadahKeys.lists() }),
      code
        ? queryClient.invalidateQueries({
            queryKey: ibadahKeys.detail(code),
            refetchType: "none",
          })
        : null,
    ]);
}

export function useSaveIbadah(code?: string) {
  const onInvalidate = useInvalidateIbadah(code);

  return useMutation({
    mutationFn: (payload: IbadahPayload) =>
      fetchOne<IbadahSaved>(
        code ? `/ibadah/${encodeURIComponent(code)}` : "/ibadah",
        { method: code ? "PUT" : "POST", body: JSON.stringify(payload) },
      ),
    onSuccess: onInvalidate,
  });
}

export function useDeleteIbadah(code: string | undefined) {
  const onInvalidate = useInvalidateIbadah(code);

  return useMutation({
    mutationFn: () =>
      fetchOne<IbadahSaved>(`/ibadah/${encodeURIComponent(code ?? "")}`, {
        method: "DELETE",
      }),
    onSuccess: onInvalidate,
  });
}

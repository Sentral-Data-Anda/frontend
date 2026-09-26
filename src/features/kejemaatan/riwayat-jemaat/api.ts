"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { SelectOption } from "@/components/common/control";
import { useDdlSearch } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type {
  RiwayatJemaat,
  RiwayatJemaatPayload,
  RiwayatJemaatSaved,
} from "./types";

export const riwayatKeys = {
  all: ["riwayat-jemaat"] as const,
  lists: () => [...riwayatKeys.all, "list"] as const,
  detail: (id: string) => [...riwayatKeys.all, "detail", id] as const,
};

export function useRiwayatList(params: ListState) {
  return useListQuery({
    queryKey: riwayatKeys.lists(),
    fetchPage: (apiQuery) =>
      fetchList<RiwayatJemaat>(`/riwayat-jemaat?${apiQuery}`),
    params,
  });
}

export function useRiwayatDetail(id: string | undefined) {
  return useQuery({
    queryKey: riwayatKeys.detail(id ?? ""),
    queryFn: () => fetchOne<RiwayatJemaat>(`/riwayat-jemaat/${id}`),
    enabled: Boolean(id),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useSaveRiwayat(id?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RiwayatJemaatPayload) =>
      fetchOne<RiwayatJemaatSaved>(
        id ? `/riwayat-jemaat/${id}` : "/riwayat-jemaat",
        { method: id ? "PUT" : "POST", body: JSON.stringify(payload) },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: riwayatKeys.lists() }),
  });
}

export function useDeleteRiwayat(id: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchOne<undefined>(`/riwayat-jemaat/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: riwayatKeys.lists() }),
  });
}

export const useJemaatOptions = (pinned: SelectOption | null) =>
  useDdlSearch("jemaat", "code", pinned);

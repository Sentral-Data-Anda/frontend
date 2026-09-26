"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys, useDdlSearch, type DdlOption } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";
import type { ApiListResponse } from "@/types/api";

import type {
  EndMarriagePayload,
  MarriageDetail,
  MarriageListItem,
  MarriagePayload,
  MarriageSaved,
} from "./types";

export const marriageKeys = {
  all: ["marriage"] as const,
  lists: () => [...marriageKeys.all, "list"] as const,
  detail: (id: string) => [...marriageKeys.all, "detail", id] as const,
};

export function useMarriageList(params: ListState) {
  return useListQuery({
    queryKey: marriageKeys.lists(),
    fetchPage: (apiQuery) =>
      fetchList<MarriageListItem>(`/marriage?${apiQuery}`),
    params,
  });
}

export function useMarriageDetail(id: string | undefined) {
  return useQuery({
    queryKey: marriageKeys.detail(id ?? ""),
    queryFn: () => fetchOne<MarriageDetail>(`/marriage/${id}`),
    enabled: Boolean(id),
    staleTime: 0,
    select: (response) => response.data,
  });
}

const useInvalidateLists = () => {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({ queryKey: marriageKeys.lists() });
};

export function useSaveMarriage(id?: string) {
  const onInvalidate = useInvalidateLists();

  return useMutation({
    mutationFn: (payload: MarriagePayload) =>
      fetchOne<MarriageSaved>(id ? `/marriage/${id}` : "/marriage", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useEndMarriage(id: string) {
  const onInvalidate = useInvalidateLists();

  return useMutation({
    mutationFn: (payload: EndMarriagePayload) =>
      fetchOne<MarriageSaved>(`/marriage/${id}/end`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteMarriage(id?: string) {
  const onInvalidate = useInvalidateLists();

  return useMutation({
    mutationFn: () =>
      fetchOne<MarriageSaved>(`/marriage/${id}`, { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

export const useJemaatOptions = () => useDdlSearch("jemaat", "code");

export function useJemaatNameOf() {
  const queryClient = useQueryClient();

  return (code: string): string | undefined =>
    queryClient
      .getQueriesData<ApiListResponse<DdlOption>>({ queryKey: ddlKeys.all })
      .filter(([key]) => String(key[1]).startsWith("jemaat?"))
      .flatMap(([, response]) => response?.data ?? [])
      .find((row) => row.code === code)?.name;
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { STATUS_PARAM } from "./model";
import type { Run, RunAction, RunDetail, RunPayload } from "./types";

export const depreciationKeys = {
  all: ["depreciation"] as const,
  lists: () => [...depreciationKeys.all, "list"] as const,
  latest: () => [...depreciationKeys.all, "latest"] as const,
  detail: (code: string) => [...depreciationKeys.all, "detail", code] as const,
};

const ASSET_KEY = ["asset"] as const;

const STEP: Record<RunAction, string> = {
  calculate: "hitung",
  post: "posting",
};

const pathOf = (code: string) => `/penyusutan/${encodeURIComponent(code)}`;

export function useRunList(params: ListState) {
  return useListQuery({
    queryKey: depreciationKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Run>(`/penyusutan?${apiQuery}`),
    params: {
      ...params,
      status: "",
      apiFilters: {
        ...params.apiFilters,
        status: STATUS_PARAM[params.status] ?? "",
      },
    },
  });
}

export function useLatestRun(isEnabled: boolean) {
  return useQuery({
    queryKey: depreciationKeys.latest(),
    queryFn: () => fetchList<Run>("/penyusutan?page=1&limit=1"),
    enabled: isEnabled,
    staleTime: 0,
    select: (response) => response.data.at(0) ?? null,
  });
}

export function useRunDetail(code: string | undefined) {
  return useQuery({
    queryKey: depreciationKeys.detail(code ?? ""),
    queryFn: () => fetchOne<RunDetail>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useOpenRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RunPayload) =>
      fetchOne<RunDetail>("/penyusutan", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: depreciationKeys.all }),
  });
}

export function useRunAction(code: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: RunAction) =>
      fetchOne<RunDetail>(`${pathOf(code)}/${STEP[action]}`, { method: "PUT" }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: depreciationKeys.all }),
        queryClient.invalidateQueries({ queryKey: ASSET_KEY }),
      ]),
    // Posting bersamaan dari layar lain: baca ulang supaya aksinya hilang.
    onError: () =>
      queryClient.invalidateQueries({ queryKey: depreciationKeys.all }),
  });
}

export function useDeleteRun(code: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fetchOne<RunDetail>(pathOf(code), { method: "DELETE" }),
    // Tanpa refetch: halaman yang masih terpasang akan membaca 404.
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: depreciationKeys.all,
        refetchType: "none",
      }),
  });
}

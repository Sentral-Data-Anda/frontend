"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";
import { MEDIA_REFETCH_MS } from "@/lib/attachment";

import type { Asset, AssetDetail, CycleKind } from "./types";

export const HISTORY_LIMIT = 5;

export const assetKeys = {
  all: ["asset"] as const,
  lists: () => [...assetKeys.all, "list"] as const,
  detail: (code: string) => [...assetKeys.all, "detail", code] as const,
  history: (kind: CycleKind, id: number) =>
    ["asset-cycle", "by-asset", kind, id] as const,
};

const pathOf = (code?: string) =>
  code ? `/asset/${encodeURIComponent(code)}` : "/asset";

export function useAssetList(params: ListState) {
  return useListQuery({
    queryKey: assetKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Asset>(`/asset?${apiQuery}`),
    params,
    refetchInterval: MEDIA_REFETCH_MS,
  });
}

export function useAssetDetail(code: string | undefined) {
  return useQuery({
    queryKey: assetKeys.detail(code ?? ""),
    queryFn: () => fetchOne<AssetDetail>(pathOf(code)),
    enabled: Boolean(code),
    staleTime: 0,
    refetchInterval: MEDIA_REFETCH_MS,
    select: (response) => response.data,
  });
}

export function useAssetHistory<T>(kind: CycleKind, id: number) {
  return useQuery({
    queryKey: assetKeys.history(kind, id),
    queryFn: () =>
      fetchList<T>(`/siklus-aset/${kind}?assetId=${id}&limit=${HISTORY_LIMIT}`),
  });
}

// Detail yang sedang terbuka tidak di-refetch: form segera ditinggalkan, dan sesudah hapus jawabannya 404.
function useInvalidateAsset() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: assetKeys.all,
        refetchType: "none",
        predicate: (query) => query.queryKey[1] === "detail",
      }),
      queryClient.invalidateQueries({
        queryKey: assetKeys.all,
        predicate: (query) => query.queryKey[1] !== "detail",
      }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.all,
        predicate: (query) => String(query.queryKey[1]).startsWith("asset"),
      }),
    ]);
}

export function useSaveAsset(code?: string) {
  const onInvalidate = useInvalidateAsset();

  return useMutation({
    mutationFn: (body: FormData) =>
      fetchOne<AssetDetail>(pathOf(code), {
        method: code ? "PUT" : "POST",
        body,
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteAsset(code: string | undefined) {
  const onInvalidate = useInvalidateAsset();

  return useMutation({
    mutationFn: () => fetchOne<unknown>(pathOf(code), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

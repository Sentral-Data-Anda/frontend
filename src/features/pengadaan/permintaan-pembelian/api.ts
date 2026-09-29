"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";
import { MEDIA_REFETCH_MS } from "@/lib/attachment";

import { toRequestApiFilters } from "./model";
import type {
  PurchaseRequest,
  PurchaseRequestDetail,
  RequestAction,
} from "./types";

export const requestKeys = {
  all: ["purchase-request"] as const,
  lists: () => [...requestKeys.all, "list"] as const,
  detail: (code: string) => [...requestKeys.all, "detail", code] as const,
};

const BASE = "/permintaan-pembelian";

const pathOf = (code?: string) =>
  code ? `${BASE}/${encodeURIComponent(code)}` : BASE;

export function useRequestList(params: ListState) {
  return useListQuery({
    queryKey: requestKeys.lists(),
    fetchPage: (apiQuery) => fetchList<PurchaseRequest>(`${BASE}?${apiQuery}`),
    params: { ...params, apiFilters: toRequestApiFilters(params.filters) },
  });
}

export function useRequestDetail(
  code: string | undefined,
  isMediaRefetched = true,
) {
  return useQuery({
    queryKey: requestKeys.detail(code ?? ""),
    queryFn: () => fetchOne<PurchaseRequestDetail>(pathOf(code)),
    enabled: Boolean(code),
    staleTime: 0,
    retry: false,
    refetchInterval: (query) =>
      isMediaRefetched && query.state.data?.data.attachments.length
        ? MEDIA_REFETCH_MS
        : false,
    select: (response) => response.data,
  });
}

function useInvalidateRequest() {
  const queryClient = useQueryClient();

  return (action: RequestAction | "simpan", isGone = false) =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: requestKeys.all,
        refetchType: isGone ? "none" : "active",
      }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.all,
        predicate: (query) =>
          String(query.queryKey[1]).startsWith("permintaan-pembelian"),
      }),
      ...(action === "pengajuan" || action === "tarik"
        ? [queryClient.invalidateQueries({ queryKey: ["persetujuan"] })]
        : []),
    ]);
}

export function useSaveRequest(code?: string) {
  const onInvalidate = useInvalidateRequest();

  return useMutation({
    mutationFn: (body: FormData) =>
      fetchOne<PurchaseRequestDetail>(pathOf(code), {
        method: code ? "PUT" : "POST",
        body,
      }),
    onSuccess: () => onInvalidate("simpan"),
  });
}

const ACTION_INIT: Record<RequestAction, { suffix: string; method: string }> = {
  pengajuan: { suffix: "/pengajuan", method: "POST" },
  tarik: { suffix: "/tarik", method: "PUT" },
  hapus: { suffix: "", method: "DELETE" },
};

export function useRequestAction(code: string) {
  const onInvalidate = useInvalidateRequest();

  return useMutation({
    mutationFn: (action: RequestAction) =>
      fetchOne<unknown>(`${pathOf(code)}${ACTION_INIT[action].suffix}`, {
        method: ACTION_INIT[action].method,
      }),
    onSettled: (_data, error, action) =>
      onInvalidate(action, action === "hapus" && !error),
  });
}

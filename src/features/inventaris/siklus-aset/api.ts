"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { ddlKeys, ddlSearchPath } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";
import type { ApiListResponse } from "@/types/api";

import { toCycleApiFilters } from "./model";
import type {
  AssetOption,
  CycleKind,
  Disposal,
  DisposalPayload,
  Maintenance,
  MaintenancePayload,
  Transfer,
  TransferPayload,
} from "./types";

const API_SEGMENT: Record<CycleKind, string> = {
  perawatan: "perawatan",
  pindah: "mutasi",
  pelepasan: "pelepasan",
};

const pathOf = (kind: CycleKind, code?: string) =>
  `/siklus-aset/${API_SEGMENT[kind]}${code ? `/${encodeURIComponent(code)}` : ""}`;

export const cycleKeys = {
  all: ["asset-cycle"] as const,
  lists: (kind: CycleKind) => [...cycleKeys.all, kind, "list"] as const,
  detail: (kind: CycleKind, code: string) =>
    [...cycleKeys.all, kind, "detail", code] as const,
};

function useCycleList<T>(kind: CycleKind, params: ListState) {
  return useListQuery({
    queryKey: cycleKeys.lists(kind),
    fetchPage: (apiQuery) => fetchList<T>(`${pathOf(kind)}?${apiQuery}`),
    params: { ...params, apiFilters: toCycleApiFilters(params.filters) },
  });
}

export const useMaintenanceList = (params: ListState) =>
  useCycleList<Maintenance>("perawatan", params);

export const useTransferList = (params: ListState) =>
  useCycleList<Transfer>("pindah", params);

export const useDisposalList = (params: ListState) =>
  useCycleList<Disposal>("pelepasan", params);

function useCycleDetail<T>(kind: CycleKind, code: string | undefined) {
  return useQuery({
    queryKey: cycleKeys.detail(kind, code ?? ""),
    queryFn: () => fetchOne<T>(pathOf(kind, code)),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export const useMaintenanceDetail = (code: string | undefined) =>
  useCycleDetail<Maintenance>("perawatan", code);

export const useTransferDetail = (code: string | undefined) =>
  useCycleDetail<Transfer>("pindah", code);

export const useDisposalDetail = (code: string | undefined) =>
  useCycleDetail<Disposal>("pelepasan", code);

const isAssetDdl = (queryKey: readonly unknown[]) =>
  String(queryKey[1]).startsWith("asset");

function useInvalidateCycle(isApproval = false) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: cycleKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["asset"] }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.all,
        predicate: (query) => isAssetDdl(query.queryKey),
      }),
      isApproval
        ? queryClient.invalidateQueries({ queryKey: ["persetujuan"] })
        : null,
    ]);
}

export function useSaveMaintenance(code?: string) {
  const onInvalidate = useInvalidateCycle();

  return useMutation({
    mutationFn: (payload: MaintenancePayload) =>
      fetchOne<Maintenance>(pathOf("perawatan", code), {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteMaintenance(code: string | undefined) {
  const onInvalidate = useInvalidateCycle();

  return useMutation({
    mutationFn: () =>
      fetchOne<Maintenance>(pathOf("perawatan", code), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

export function useCreateTransfer() {
  const onInvalidate = useInvalidateCycle();

  return useMutation({
    mutationFn: (payload: TransferPayload) =>
      fetchOne<Transfer>(pathOf("pindah"), {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useSubmitDisposal() {
  const onInvalidate = useInvalidateCycle(true);

  return useMutation({
    mutationFn: (payload: DisposalPayload) =>
      fetchOne<Disposal>(pathOf("pelepasan"), {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useWithdrawDisposal(code: string) {
  const onInvalidate = useInvalidateCycle(true);

  return useMutation({
    mutationFn: () =>
      fetchOne<Disposal>(`${pathOf("pelepasan", code)}/tarik`, {
        method: "PUT",
      }),
    onSettled: onInvalidate,
  });
}

export function usePresetAsset(code: string) {
  const path = ddlSearchPath("asset", code);

  return useQuery({
    queryKey: ddlKeys.list(path),
    queryFn: () => fetchList<AssetOption>(`/ddl/${path}`),
    enabled: Boolean(code),
    staleTime: 10 * 60_000,
    retry: false,
    select: (response) => response.data.find((row) => row.code === code),
  });
}

// Baris ddl tidak dikembalikan useDdlSearch; baris terpilih dibaca dari cache-nya.
export const findAssetRow = (queryClient: QueryClient, id: string) => {
  const cached = queryClient.getQueriesData<ApiListResponse<AssetOption>>({
    queryKey: ddlKeys.all,
    predicate: (query) => isAssetDdl(query.queryKey),
  });

  for (const [, response] of cached) {
    const row = response?.data.find((item) => String(item.id) === id);
    if (row) return row;
  }

  return undefined;
};

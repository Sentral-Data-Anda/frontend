"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";
import type { BudgetSetting } from "@/types/anggaran";

import type {
  BudgetAllocation,
  BudgetAllocationBatchPayload,
  BudgetAllocationDetail,
  BudgetAllocationPayload,
  BudgetSettingPayload,
  YearProgram,
} from "./types";

export const allocationKeys = {
  all: ["budget-allocation"] as const,
  lists: () => [...allocationKeys.all, "list"] as const,
  detail: (publicId: string) =>
    [...allocationKeys.all, "detail", publicId] as const,
};

export const settingKeys = { all: ["budget-setting"] as const };

const PROGRAM_KEY = ["program"] as const;

const allocationPath = (publicId?: string) =>
  publicId
    ? `/pagu-anggaran/${encodeURIComponent(publicId)}`
    : "/pagu-anggaran";

function useInvalidateAllocation(isDetailRefetched: boolean) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: allocationKeys.all,
        predicate: (query) =>
          isDetailRefetched || query.queryKey[1] !== "detail",
      }),
      queryClient.invalidateQueries({
        queryKey: allocationKeys.all,
        refetchType: "none",
        predicate: (query) =>
          !isDetailRefetched && query.queryKey[1] === "detail",
      }),
      queryClient.invalidateQueries({ queryKey: PROGRAM_KEY }),
    ]);
}

export function useBudgetSetting(isEnabled = true) {
  return useQuery({
    queryKey: settingKeys.all,
    queryFn: () => fetchOne<BudgetSetting>("/setelan-anggaran"),
    enabled: isEnabled,
    select: (response) => response.data,
  });
}

export function useSaveBudgetSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BudgetSettingPayload) =>
      fetchOne<BudgetSetting>("/setelan-anggaran", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: settingKeys.all }),
        queryClient.invalidateQueries({ queryKey: allocationKeys.all }),
        queryClient.invalidateQueries({ queryKey: PROGRAM_KEY }),
      ]),
  });
}

export function useAllocationList(params: ListState) {
  return useListQuery({
    queryKey: allocationKeys.lists(),
    fetchPage: (apiQuery) =>
      fetchList<BudgetAllocation>(`/pagu-anggaran?${apiQuery}`),
    params: { ...params, status: "" },
  });
}

export function useAllocationDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: allocationKeys.detail(publicId ?? ""),
    queryFn: () => fetchOne<BudgetAllocationDetail>(allocationPath(publicId)),
    enabled: Boolean(publicId),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useYearPrograms(bapelId: number | undefined, year: number) {
  return useQuery({
    queryKey: [...PROGRAM_KEY, "ceiling", bapelId ?? 0, year],
    queryFn: () =>
      fetchList<YearProgram>(
        `/program?bapelId=${bapelId}&year=${year}&limit=50`,
      ),
    enabled: Boolean(bapelId),
    select: (response) => response.data,
  });
}

export function useSaveAllocation(publicId?: string) {
  const onInvalidate = useInvalidateAllocation(false);

  return useMutation({
    mutationFn: (payload: BudgetAllocationPayload) =>
      fetchOne<BudgetAllocationDetail>(allocationPath(publicId), {
        method: publicId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useSaveAllocationBatch() {
  const onInvalidate = useInvalidateAllocation(true);

  return useMutation({
    mutationFn: (payload: BudgetAllocationBatchPayload) =>
      fetchOne<BudgetAllocation[]>("/pagu-anggaran/batch", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteAllocation(publicId: string | undefined) {
  const onInvalidate = useInvalidateAllocation(false);

  return useMutation({
    mutationFn: () =>
      fetchOne<unknown>(allocationPath(publicId), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

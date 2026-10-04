"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";
import type { BudgetSetting } from "@/types/anggaran";

import { toProgramQuery } from "./model";
import type {
  Program,
  ProgramAction,
  ProgramDetail,
  ProgramPayload,
} from "./types";

export const programKeys = {
  all: ["program"] as const,
  lists: () => [...programKeys.all, "list"] as const,
  detail: (publicId: string) =>
    [...programKeys.all, "detail", publicId] as const,
};

const SETTING_KEY = ["budget-setting"] as const;

const ALLOCATION_KEY = ["budget-allocation"] as const;

const APPROVAL_KEY = ["persetujuan"] as const;

const ACTION_INIT: Record<ProgramAction, { suffix: string; method: string }> = {
  pengajuan: { suffix: "/pengajuan", method: "POST" },
  tarik: { suffix: "/tarik", method: "PUT" },
  hapus: { suffix: "", method: "DELETE" },
};

const programPath = (publicId?: string) =>
  publicId ? `/program/${encodeURIComponent(publicId)}` : "/program";

function useInvalidateProgram() {
  const queryClient = useQueryClient();

  return (isApprovalTouched = false) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: programKeys.all }),
      queryClient.invalidateQueries({ queryKey: ALLOCATION_KEY }),
      ...(isApprovalTouched
        ? [queryClient.invalidateQueries({ queryKey: APPROVAL_KEY })]
        : []),
    ]);
}

export function useBudgetSetting() {
  return useQuery({
    queryKey: SETTING_KEY,
    queryFn: () => fetchOne<BudgetSetting>("/setelan-anggaran"),
    select: (response) => response.data,
  });
}

export function useProgramList(params: ListState, year: string) {
  const query = toProgramQuery(params.status, params.filters, year);

  return useListQuery({
    queryKey: programKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Program>(`/program?${apiQuery}`),
    params: { ...params, ...query },
  });
}

export function useProgramDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: programKeys.detail(publicId ?? ""),
    queryFn: () => fetchOne<ProgramDetail>(programPath(publicId)),
    enabled: Boolean(publicId),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useSaveProgram(publicId?: string) {
  const onInvalidate = useInvalidateProgram();

  return useMutation({
    mutationFn: (payload: ProgramPayload) =>
      fetchOne<ProgramDetail>(programPath(publicId), {
        method: publicId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => onInvalidate(),
  });
}

export function useProgramAction(publicId: string) {
  const onInvalidate = useInvalidateProgram();

  return useMutation({
    mutationFn: (action: ProgramAction) =>
      fetchOne<unknown>(
        `${programPath(publicId)}${ACTION_INIT[action].suffix}`,
        {
          method: ACTION_INIT[action].method,
        },
      ),
    onSuccess: (_data, action) => onInvalidate(action !== "hapus"),
  });
}

export function useCancelProgram(publicId: string) {
  const onInvalidate = useInvalidateProgram();

  return useMutation({
    mutationFn: (payload: { cancelReason: string }) =>
      fetchOne<ProgramDetail>(`${programPath(publicId)}/batal`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => onInvalidate(true),
  });
}

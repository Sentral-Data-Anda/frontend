"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { toPermintaanParams } from "./model";
import type {
  ApprovalDetail,
  ApprovalListItem,
  ApprovalRequest,
  ApprovalView,
} from "./types";

export const persetujuanKeys = {
  all: ["persetujuan"] as const,
  lists: () => [...persetujuanKeys.all, "list"] as const,
  list: (view: ApprovalView) => [...persetujuanKeys.lists(), view] as const,
  detail: (id: string) => [...persetujuanKeys.all, "detail", id] as const,
};

const requestPath = (id: string) => `/persetujuan/${encodeURIComponent(id)}`;

export function usePermintaanList(params: ListState, view: ApprovalView) {
  return useListQuery({
    queryKey: persetujuanKeys.list(view),
    fetchPage: (apiQuery) =>
      fetchList<ApprovalListItem>(`/persetujuan?${apiQuery}`),
    params: toPermintaanParams(params, view),
  });
}

export function usePermintaanDetail(id: string, isEnabled = true) {
  return useQuery({
    queryKey: persetujuanKeys.detail(id),
    queryFn: () => fetchOne<ApprovalDetail>(requestPath(id)),
    enabled: isEnabled,
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useDecision<TBody>(id: string, verb: "setujui" | "tolak" | "tarik") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: TBody) =>
      fetchOne<ApprovalRequest>(`${requestPath(id)}/${verb}`, {
        method: "PUT",
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    // Detail yang masih terbuka tidak diambil ulang: layar sedang pergi, jangan berkedip.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: persetujuanKeys.all,
          predicate: (query) => query.queryKey[1] !== "detail",
        }),
        queryClient.invalidateQueries({
          queryKey: persetujuanKeys.detail(id),
          refetchType: "none",
        }),
      ]),
  });
}

export const useApprove = (id: string) => useDecision<void>(id, "setujui");

export const useReject = (id: string) =>
  useDecision<{ note: string }>(id, "tolak");

export const useWithdraw = (id: string) => useDecision<void>(id, "tarik");

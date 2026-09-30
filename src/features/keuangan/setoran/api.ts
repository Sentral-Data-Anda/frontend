"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useDdlOptions } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { toTransferApiFilters } from "./model";
import type {
  Transfer,
  TransferAccountOption,
  TransferAction,
  TransferPayload,
} from "./types";

export const transferKeys = {
  all: ["cash-transfer"] as const,
  lists: () => [...transferKeys.all, "list"] as const,
  detail: (code: string) => [...transferKeys.all, "detail", code] as const,
};

export const ASSET_ACCOUNT_DDL = "account?type=ASSET";

const pathOf = (code: string) => `/setoran/${encodeURIComponent(code)}`;

export function useTransferList(params: ListState) {
  return useListQuery({
    queryKey: transferKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Transfer>(`/setoran?${apiQuery}`),
    params: { ...params, apiFilters: toTransferApiFilters(params.filters) },
  });
}

export function useTransferDetail(code: string | undefined) {
  return useQuery({
    queryKey: transferKeys.detail(code ?? ""),
    queryFn: () => fetchOne<Transfer>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export const useAssetAccounts = () =>
  useDdlOptions<TransferAccountOption>(ASSET_ACCOUNT_DDL);

export function useSaveTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TransferPayload) =>
      fetchOne<Transfer>("/setoran", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: transferKeys.all }),
  });
}

export function useTransferAction(code: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      action,
      reason,
    }: {
      action: TransferAction;
      reason?: string;
    }) =>
      fetchOne<Transfer>(`${pathOf(code)}/${action}`, {
        method: "PUT",
        ...(reason === undefined ? {} : { body: JSON.stringify({ reason }) }),
      }),
    onSuccess: () =>
      Promise.all(
        [transferKeys.all, ["journal"]].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}

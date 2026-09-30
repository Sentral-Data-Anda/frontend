"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import type { ListFilterSchema, ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { GATEWAY_SETTING_KEY, toReceiptApiFilters } from "./model";
import type {
  CashReceipt,
  CashReceiptDetail,
  CashReceiptPayload,
  ReceiptAction,
} from "./types";

export const receiptKeys = {
  all: ["cash-receipt"] as const,
  lists: () => [...receiptKeys.all, "list"] as const,
  detail: (publicId: string) =>
    [...receiptKeys.all, "detail", publicId] as const,
};

const JOURNAL_KEY = ["journal"] as const;

const SETTING_KEY = ["accounting-setting"] as const;

export const RECEIPT_FILTERS = {
  bulan: { api: "bulan" },
} satisfies ListFilterSchema;

type SettingRow = {
  key: string;
  account: { id: number; code: string; name: string } | null;
};

const pathOf = (publicId: string) =>
  `/kas-masuk/${encodeURIComponent(publicId)}`;

const invalidateReceipts = (
  queryClient: QueryClient,
  isJournalTouched = false,
) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: receiptKeys.all }),
    isJournalTouched
      ? queryClient.invalidateQueries({ queryKey: JOURNAL_KEY })
      : Promise.resolve(),
  ]);

export function useReceiptList(params: ListState) {
  return useListQuery({
    queryKey: receiptKeys.lists(),
    fetchPage: (apiQuery) => fetchList<CashReceipt>(`/kas-masuk?${apiQuery}`),
    params: { ...params, apiFilters: toReceiptApiFilters(params.filters) },
  });
}

export function useReceiptDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: receiptKeys.detail(publicId ?? ""),
    queryFn: () => fetchOne<CashReceiptDetail>(pathOf(publicId ?? "")),
    enabled: Boolean(publicId),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useGatewayAccount(isEnabled: boolean) {
  const query = useQuery({
    queryKey: SETTING_KEY,
    queryFn: () => fetchList<SettingRow>("/setelan-akuntansi"),
    enabled: isEnabled,
    retry: false,
    staleTime: 60_000,
    select: (response) =>
      response.data.find((row) => row.key === GATEWAY_SETTING_KEY)?.account ??
      null,
  });

  return {
    account: query.data ?? null,
    isPending: isEnabled && query.isPending,
    isMissing: isEnabled && !query.isPending && !query.data,
  };
}

export function useSaveReceipt(publicId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CashReceiptPayload) =>
      fetchOne<CashReceiptDetail>(publicId ? pathOf(publicId) : "/kas-masuk", {
        method: publicId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => invalidateReceipts(queryClient),
  });
}

export function useReceiptAction(publicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      action,
      cancelReason,
    }: {
      action: ReceiptAction;
      cancelReason?: string;
    }) =>
      action === "hapus"
        ? fetchOne<Pick<CashReceipt, "publicId" | "code">>(pathOf(publicId), {
            method: "DELETE",
          })
        : fetchOne<CashReceiptDetail>(`${pathOf(publicId)}/${action}`, {
            method: "PUT",
            body:
              action === "batal" ? JSON.stringify({ cancelReason }) : undefined,
          }),
    onSuccess: (_response, variables) =>
      invalidateReceipts(queryClient, variables.action !== "hapus"),
  });
}

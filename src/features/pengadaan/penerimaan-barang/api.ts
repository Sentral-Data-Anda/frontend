"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";
import { MEDIA_REFETCH_MS } from "@/lib/attachment";

import { toReceiptApiFilters } from "./model";
import type {
  OrderForReceipt,
  OrderOption,
  Receipt,
  ReceiptDetail,
  StockItemOption,
} from "./types";

export const receiptKeys = {
  all: ["goods-receipt"] as const,
  lists: () => [...receiptKeys.all, "list"] as const,
  detail: (code: string) => [...receiptKeys.all, "detail", code] as const,
};

export const OPEN_ORDER_DDL = "pesanan-pembelian?terbuka=1";

export const STOCK_ITEM_DDL = "barang-persediaan";

const INVENTORY_DDL = ["pesanan-pembelian", "barang-persediaan", "asset"];

const pathOf = (code: string) =>
  `/penerimaan-barang/${encodeURIComponent(code)}`;

export function useReceiptList(params: ListState) {
  return useListQuery({
    queryKey: receiptKeys.lists(),
    fetchPage: (apiQuery) =>
      fetchList<Receipt>(`/penerimaan-barang?${apiQuery}`),
    params: { ...params, apiFilters: toReceiptApiFilters(params.filters) },
  });
}

export function useReceiptDetail(code: string | undefined) {
  return useQuery({
    queryKey: receiptKeys.detail(code ?? ""),
    queryFn: () => fetchOne<ReceiptDetail>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.data?.data.attachments.length ? MEDIA_REFETCH_MS : false,
    select: (response) => response.data,
  });
}

function useDdlRows<T>(path: string, isEnabled: boolean) {
  const query = useQuery({
    queryKey: ddlKeys.list(path),
    queryFn: () => fetchList<T>(`/ddl/${path}`),
    enabled: isEnabled,
    staleTime: 0,
    select: (response) => response.data,
  });

  return {
    rows: query.data ?? [],
    isLoading: query.isFetching,
    onRefetch: query.refetch,
  };
}

export const useOpenOrders = (isEnabled: boolean) =>
  useDdlRows<OrderOption>(OPEN_ORDER_DDL, isEnabled);

export const useStockItems = (isEnabled: boolean) =>
  useDdlRows<StockItemOption>(STOCK_ITEM_DDL, isEnabled);

export const fetchOrderForReceipt = (queryClient: QueryClient, code: string) =>
  queryClient
    .fetchQuery({
      queryKey: ["purchase-order", "detail", code],
      queryFn: () =>
        fetchOne<OrderForReceipt>(
          `/pesanan-pembelian/${encodeURIComponent(code)}`,
        ),
      staleTime: 0,
    })
    .then((response) => response.data);

export function useSaveReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: FormData) =>
      fetchOne<ReceiptDetail>("/penerimaan-barang", { method: "POST", body }),
    onSuccess: () =>
      Promise.all([
        ...[
          receiptKeys.all,
          ["purchase-order"],
          ["asset"],
          ["stock-item"],
          ["stock-movement"],
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        queryClient.invalidateQueries({
          queryKey: ddlKeys.all,
          predicate: (query) =>
            INVENTORY_DDL.some((name) =>
              String(query.queryKey[1]).startsWith(name),
            ),
        }),
      ]),
  });
}

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
import { FetchError, fetchList, fetchOne } from "@/lib/api/fetcher";

import { isForeign, toOrderApiFilters } from "./model";
import type {
  CurrencyOption,
  Order,
  OrderAction,
  OrderDetail,
  OrderPayload,
  RatePreview,
  RequestDetail,
  RequestOption,
} from "./types";

export const orderKeys = {
  all: ["purchase-order"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  detail: (code: string) => [...orderKeys.all, "detail", code] as const,
};

const REQUEST_KEY = ["purchase-request"] as const;

const REQUEST_DDL = "permintaan-pembelian";
const CURRENCY_DDL = "currency";

const LINKED_DDL = ["pesanan-pembelian", REQUEST_DDL];

const pathOf = (code: string) =>
  `/pesanan-pembelian/${encodeURIComponent(code)}`;

export const ratePath = (currencyCode: string, date: string) =>
  `kurs?currencyCode=${encodeURIComponent(currencyCode)}&date=${date}`;

const isLinkedDdl = (queryKey: readonly unknown[]) =>
  LINKED_DDL.some((name) => String(queryKey[1]).startsWith(name));

const invalidateOrders = (
  queryClient: QueryClient,
  orderKey: readonly string[] = orderKeys.all,
) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: orderKey }),
    queryClient.invalidateQueries({ queryKey: REQUEST_KEY }),
    queryClient.invalidateQueries({
      queryKey: ddlKeys.all,
      predicate: (query) => isLinkedDdl(query.queryKey),
    }),
  ]);

export function useOrderList(params: ListState) {
  return useListQuery({
    queryKey: orderKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Order>(`/pesanan-pembelian?${apiQuery}`),
    params: { ...params, apiFilters: toOrderApiFilters(params.filters) },
  });
}

export function useOrderDetail(code: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(code ?? ""),
    queryFn: () => fetchOne<OrderDetail>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useRequestOptions() {
  return useQuery({
    queryKey: ddlKeys.list(REQUEST_DDL),
    queryFn: () => fetchList<RequestOption>(`/ddl/${REQUEST_DDL}`),
    staleTime: 60_000,
    select: (response) => response.data,
  });
}

export function useCurrencyOptions() {
  return useQuery({
    queryKey: ddlKeys.list(CURRENCY_DDL),
    queryFn: () => fetchList<CurrencyOption>(`/ddl/${CURRENCY_DDL}`),
    staleTime: 10 * 60_000,
    select: (response) => response.data,
  });
}

export function useRatePreview(currencyCode: string, orderDate: string) {
  const isEnabled =
    Boolean(currencyCode) &&
    isForeign(currencyCode) &&
    /^\d{4}-\d{2}-\d{2}$/.test(orderDate);
  const query = useQuery({
    queryKey: ddlKeys.list(ratePath(currencyCode, orderDate)),
    queryFn: () =>
      fetchOne<RatePreview>(`/ddl/${ratePath(currencyCode, orderDate)}`),
    enabled: isEnabled,
    staleTime: 60_000,
    retry: false,
    select: (response) => response.data,
  });
  const isMissing =
    query.error instanceof FetchError && query.error.status === 404;

  return {
    rate: isEnabled ? (query.data ?? null) : null,
    isEnabled,
    isLoading: isEnabled && query.isPending && !query.error,
    isMissing: isEnabled && isMissing,
    isFailed: isEnabled && Boolean(query.error) && !isMissing,
  };
}

const requestDetailQuery = (code: string) => ({
  queryKey: [...REQUEST_KEY, "detail", code],
  queryFn: () =>
    fetchOne<RequestDetail>(
      `/permintaan-pembelian/${encodeURIComponent(code)}`,
    ),
  staleTime: 0,
});

export function useRequestDetail(code: string | undefined) {
  return useQuery({
    ...requestDetailQuery(code ?? ""),
    enabled: Boolean(code),
    retry: false,
    select: (response) => response.data,
  });
}

export const fetchRequestDetail = (queryClient: QueryClient, code: string) =>
  queryClient
    .fetchQuery(requestDetailQuery(code))
    .then((response) => response.data);

export function useSaveOrder(code?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OrderPayload) =>
      fetchOne<OrderDetail>(code ? pathOf(code) : "/pesanan-pembelian", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => invalidateOrders(queryClient),
  });
}

export function useOrderAction(code: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: OrderAction) =>
      action === "hapus"
        ? fetchOne<Pick<OrderDetail, "publicId" | "code">>(pathOf(code), {
            method: "DELETE",
          })
        : fetchOne<OrderDetail>(`${pathOf(code)}/${action}`, {
            method: "PUT",
          }),
    onSuccess: (_response, action) =>
      invalidateOrders(
        queryClient,
        action === "hapus" ? orderKeys.lists() : orderKeys.all,
      ),
  });
}

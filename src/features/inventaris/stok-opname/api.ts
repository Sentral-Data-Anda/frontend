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
import type { ApiListResponse } from "@/types/api";

import { toOpnameApiFilters } from "./model";
import type {
  Opname,
  OpnameAction,
  OpnameDetail,
  OpnamePayload,
  StockItemOption,
} from "./types";

export const opnameKeys = {
  all: ["stock-opname"] as const,
  lists: () => [...opnameKeys.all, "list"] as const,
  detail: (code: string) => [...opnameKeys.all, "detail", code] as const,
};

export const STOCK_ITEM_DDL = "barang-persediaan";

export const stockItemDdlPath = (roomId: string) =>
  roomId ? `${STOCK_ITEM_DDL}?roomId=${roomId}` : STOCK_ITEM_DDL;

const pathOf = (code: string) => `/stok-opname/${encodeURIComponent(code)}`;

const isStockItemDdl = (queryKey: readonly unknown[]) =>
  String(queryKey[1]).startsWith(STOCK_ITEM_DDL);

export function useOpnameList(params: ListState) {
  return useListQuery({
    queryKey: opnameKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Opname>(`/stok-opname?${apiQuery}`),
    params: { ...params, apiFilters: toOpnameApiFilters(params.filters) },
  });
}

export function useOpnameDetail(code: string | undefined) {
  return useQuery({
    queryKey: opnameKeys.detail(code ?? ""),
    queryFn: () => fetchOne<OpnameDetail>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export const fetchStockItems = (queryClient: QueryClient, roomId: string) => {
  const path = stockItemDdlPath(roomId);

  return queryClient
    .fetchQuery({
      queryKey: ddlKeys.list(path),
      queryFn: () => fetchList<StockItemOption>(`/ddl/${path}`),
      staleTime: 0,
    })
    .then((response) => response.data);
};

export const findCachedStockItem = (queryClient: QueryClient, id: string) =>
  queryClient
    .getQueriesData<ApiListResponse<StockItemOption>>({
      queryKey: ddlKeys.all,
      predicate: (query) => isStockItemDdl(query.queryKey),
    })
    .flatMap(([, response]) => response?.data ?? [])
    .find((row) => String(row.id) === id);

export function useSaveOpname(code?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OpnamePayload) =>
      fetchOne<OpnameDetail>(code ? pathOf(code) : "/stok-opname", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: opnameKeys.all }),
  });
}

export function useOpnameAction(code: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: OpnameAction) =>
      fetchOne<OpnameDetail>(`${pathOf(code)}/${action}`, { method: "PUT" }),
    onSuccess: (_response, action) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: opnameKeys.all }),
        ...(action === "posting"
          ? [
              queryClient.invalidateQueries({ queryKey: ["stock-item"] }),
              queryClient.invalidateQueries({ queryKey: ["stock-movement"] }),
              queryClient.invalidateQueries({
                queryKey: ddlKeys.all,
                predicate: (query) => isStockItemDdl(query.queryKey),
              }),
            ]
          : []),
      ]),
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys, ddlSearchPath } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { toMutasiApiFilters } from "./model";
import type { Movement, MovementPayload, StockOption } from "./types";

export const mutasiKeys = {
  all: ["stock-movement"] as const,
  lists: () => [...mutasiKeys.all, "list"] as const,
};

export const STOCK_DDL = "barang-persediaan";

const isStockDdl = (key: readonly unknown[]) =>
  String(key[1]).startsWith(STOCK_DDL);

export function useMutasiList(params: ListState) {
  return useListQuery({
    queryKey: mutasiKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Movement>(`/mutasi-stok?${apiQuery}`),
    params: { ...params, apiFilters: toMutasiApiFilters(params.filters) },
  });
}

export function usePresetStock(code: string) {
  const path = ddlSearchPath(STOCK_DDL, code);

  return useQuery({
    queryKey: ddlKeys.list(path),
    queryFn: () => fetchList<StockOption>(`/ddl/${path}`),
    enabled: Boolean(code),
    staleTime: 10 * 60_000,
    select: (response) =>
      response.data.find(
        (row) => row.code.toLowerCase() === code.toLowerCase(),
      ) ?? null,
  });
}

export function useCreateMutasi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MovementPayload) =>
      fetchOne<Movement>("/mutasi-stok", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: mutasiKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["stock-item"] }),
        queryClient.invalidateQueries({
          queryKey: ddlKeys.all,
          predicate: (query) => isStockDdl(query.queryKey),
        }),
      ]),
  });
}

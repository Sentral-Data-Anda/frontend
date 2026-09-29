"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { HISTORY_LIMIT } from "./model";
import type { ItemMovement, StockItem, StockItemPayload } from "./types";

export const stockKeys = {
  all: ["stock-item"] as const,
  lists: () => [...stockKeys.all, "list"] as const,
  detail: (code: string) => [...stockKeys.all, "detail", code] as const,
};

const MOVEMENT_KEY = ["stock-movement"] as const;

const pathOf = (code?: string) =>
  code
    ? `/barang-persediaan/${encodeURIComponent(code)}`
    : "/barang-persediaan";

export function useStockList(params: ListState) {
  return useListQuery({
    queryKey: stockKeys.lists(),
    fetchPage: (apiQuery) =>
      fetchList<StockItem>(`/barang-persediaan?${apiQuery}`),
    params,
  });
}

export function useStockDetail(code: string | undefined) {
  return useQuery({
    queryKey: stockKeys.detail(code ?? ""),
    queryFn: () => fetchOne<StockItem>(pathOf(code)),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useItemMovements(stockItemId: number | undefined) {
  return useQuery({
    queryKey: [...MOVEMENT_KEY, "by-item", stockItemId],
    queryFn: () =>
      fetchList<ItemMovement>(
        `/mutasi-stok?stockItemId=${stockItemId}&limit=${HISTORY_LIMIT}`,
      ),
    enabled: stockItemId !== undefined,
  });
}

// Detail yang sedang terbuka tidak di-refetch: form segera ditinggalkan, dan sesudah hapus jawabannya 404.
function useInvalidateStock(isCreate: boolean) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: stockKeys.all,
        refetchType: "none",
        predicate: (query) => query.queryKey[1] === "detail",
      }),
      queryClient.invalidateQueries({
        queryKey: stockKeys.all,
        predicate: (query) => query.queryKey[1] !== "detail",
      }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.all,
        predicate: (query) =>
          String(query.queryKey[1]).startsWith("barang-persediaan"),
      }),
      isCreate
        ? queryClient.invalidateQueries({ queryKey: MOVEMENT_KEY })
        : null,
    ]);
}

export function useSaveStock(code?: string) {
  const onInvalidate = useInvalidateStock(!code);

  return useMutation({
    mutationFn: (payload: StockItemPayload) =>
      fetchOne<StockItem>(pathOf(code), {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteStock(code: string | undefined) {
  const onInvalidate = useInvalidateStock(false);

  return useMutation({
    mutationFn: () => fetchOne<unknown>(pathOf(code), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

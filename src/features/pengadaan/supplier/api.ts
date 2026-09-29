"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { IS_ACTIVE_PARAM } from "./model";
import type { Supplier, SupplierPayload } from "./types";

export const supplierKeys = {
  all: ["supplier"] as const,
  lists: () => [...supplierKeys.all, "list"] as const,
  detail: (code: string) => [...supplierKeys.all, "detail", code] as const,
};

const pathOf = (code?: string) =>
  code ? `/supplier/${encodeURIComponent(code)}` : "/supplier";

export function useSupplierList(params: ListState) {
  return useListQuery({
    queryKey: supplierKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Supplier>(`/supplier?${apiQuery}`),
    params: {
      ...params,
      status: "",
      apiFilters: { isActive: IS_ACTIVE_PARAM[params.status] ?? "" },
    },
  });
}

export function useSupplierDetail(code: string | undefined) {
  return useQuery({
    queryKey: supplierKeys.detail(code ?? ""),
    queryFn: () => fetchOne<Supplier>(pathOf(code)),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

// Detail tidak di-refetch: form segera ditinggalkan, dan sesudah hapus jawabannya 404.
function useInvalidateSupplier() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: supplierKeys.all,
        refetchType: "none",
        predicate: (query) => query.queryKey[1] === "detail",
      }),
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.all,
        predicate: (query) => String(query.queryKey[1]).startsWith("supplier"),
      }),
    ]);
}

export function useSaveSupplier(code?: string) {
  const onInvalidate = useInvalidateSupplier();

  return useMutation({
    mutationFn: (payload: SupplierPayload) =>
      fetchOne<Supplier>(pathOf(code), {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteSupplier(code: string | undefined) {
  const onInvalidate = useInvalidateSupplier();

  return useMutation({
    mutationFn: () => fetchOne<unknown>(pathOf(code), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { IS_ACTIVE_PARAM } from "./model";
import type { OfferingType, OfferingTypePayload } from "./types";

export const offeringTypeKeys = {
  all: ["offering-type"] as const,
  lists: () => [...offeringTypeKeys.all, "list"] as const,
  detail: (code: string) => [...offeringTypeKeys.all, "detail", code] as const,
};

const pathOf = (code?: string) =>
  code ? `/type-persembahan/${encodeURIComponent(code)}` : "/type-persembahan";

export const isOfferingTypeDdl = (key: readonly unknown[]) =>
  String(key[1]).startsWith("tipe-persembahan");

export function useOfferingTypeList(params: ListState) {
  return useListQuery({
    queryKey: offeringTypeKeys.lists(),
    fetchPage: (apiQuery) =>
      fetchList<OfferingType>(`/type-persembahan?${apiQuery}`),
    params: {
      ...params,
      status: "",
      apiFilters: { isActive: IS_ACTIVE_PARAM[params.status] ?? "" },
    },
  });
}

export function useOfferingTypeDetail(code: string | undefined) {
  return useQuery({
    queryKey: offeringTypeKeys.detail(code ?? ""),
    queryFn: () => fetchOne<OfferingType>(pathOf(code)),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

// Detail tidak di-refetch: sesudah hapus jawabannya 404.
function useInvalidateOfferingType(code: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: offeringTypeKeys.lists() }),
      queryClient.invalidateQueries({
        queryKey: offeringTypeKeys.detail(code ?? ""),
        refetchType: "none",
      }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.all,
        predicate: (query) => isOfferingTypeDdl(query.queryKey),
      }),
    ]);
}

export function useSaveOfferingType(code?: string) {
  const onInvalidate = useInvalidateOfferingType(code);

  return useMutation({
    mutationFn: (payload: OfferingTypePayload) =>
      fetchOne<OfferingType>(pathOf(code), {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteOfferingType(code: string | undefined) {
  const onInvalidate = useInvalidateOfferingType(code);

  return useMutation({
    mutationFn: () => fetchOne<unknown>(pathOf(code), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

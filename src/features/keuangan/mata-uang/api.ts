"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { toRateApiFilters } from "./model";
import type { Currency, CurrencyPayload, Rate, RatePayload } from "./types";

export const currencyKeys = {
  all: ["currency"] as const,
  lists: () => [...currencyKeys.all, "list"] as const,
  detail: (code: string) => [...currencyKeys.all, "detail", code] as const,
  rates: (code: string) => [...currencyKeys.all, "rates", code] as const,
  rate: (id: string) => [...currencyKeys.all, "rate", id] as const,
};

const currencyPath = (code?: string) =>
  code ? `/mata-uang/${encodeURIComponent(code)}` : "/mata-uang";

const ratePath = (id?: string | number) =>
  id === undefined
    ? "/mata-uang/kurs"
    : `/mata-uang/kurs/${encodeURIComponent(id)}`;

export const isCurrencyDdl = (key: readonly unknown[]) => {
  const name = String(key[1]);

  return name.startsWith("currency") || name.startsWith("kurs");
};

export function useCurrencyList(params: ListState) {
  return useListQuery({
    queryKey: currencyKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Currency>(`/mata-uang?${apiQuery}`),
    params: { ...params, status: "" },
  });
}

export function useCurrencyDetail(code: string | undefined) {
  return useQuery({
    queryKey: currencyKeys.detail(code ?? ""),
    queryFn: () => fetchOne<Currency>(currencyPath(code)),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useRateList(currencyCode: string, params: ListState) {
  return useListQuery({
    queryKey: currencyKeys.rates(currencyCode),
    fetchPage: (apiQuery) => fetchList<Rate>(`/mata-uang/kurs?${apiQuery}`),
    params: {
      ...params,
      search: "",
      status: "",
      apiFilters: toRateApiFilters(currencyCode, params.filters),
    },
  });
}

export function useRateDetail(id: string | undefined) {
  return useQuery({
    queryKey: currencyKeys.rate(id ?? ""),
    queryFn: () => fetchOne<Rate>(ratePath(id)),
    enabled: Boolean(id),
    staleTime: 0,
    select: (response) => response.data,
  });
}

// Tanpa refetch untuk entri yang sedang terbuka: sesudah hapus jawabannya 404.
function useInvalidateCurrency(isDetailRefetched: boolean) {
  const queryClient = useQueryClient();

  const isEntry = (key: readonly unknown[]) =>
    key[1] === "rate" || (!isDetailRefetched && key[1] === "detail");

  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: currencyKeys.all,
        predicate: (query) => !isEntry(query.queryKey),
      }),
      queryClient.invalidateQueries({
        queryKey: currencyKeys.all,
        refetchType: "none",
        predicate: (query) => isEntry(query.queryKey),
      }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.all,
        predicate: (query) => isCurrencyDdl(query.queryKey),
      }),
    ]);
}

export function useSaveCurrency(code?: string) {
  const onInvalidate = useInvalidateCurrency(false);

  return useMutation({
    mutationFn: (payload: CurrencyPayload) =>
      fetchOne<Currency>(currencyPath(code), {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteCurrency(code: string) {
  const onInvalidate = useInvalidateCurrency(false);

  return useMutation({
    mutationFn: () =>
      fetchOne<unknown>(currencyPath(code), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

export function useSaveRate(id?: string) {
  const onInvalidate = useInvalidateCurrency(true);

  return useMutation({
    mutationFn: (payload: RatePayload) =>
      fetchOne<Rate>(ratePath(id), {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteRate() {
  const onInvalidate = useInvalidateCurrency(true);

  return useMutation({
    mutationFn: (id: number) =>
      fetchOne<unknown>(ratePath(id), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

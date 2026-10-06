"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { KontrakKaryawan, KontrakKaryawanPayload } from "./types";

const BASE = "/kontrak-karyawan";

const pathOf = (code: string) => `${BASE}/${encodeURIComponent(code)}`;

export const kontrakKaryawanKeys = {
  all: ["kontrak-karyawan"] as const,
  lists: () => [...kontrakKaryawanKeys.all, "list"] as const,
  detail: (code: string) =>
    [...kontrakKaryawanKeys.all, "detail", code] as const,
};

export function useKontrakList(params: ListState) {
  return useListQuery({
    queryKey: kontrakKaryawanKeys.lists(),
    fetchPage: (apiQuery) => fetchList<KontrakKaryawan>(`${BASE}?${apiQuery}`),
    params,
  });
}

export function useKontrakDetail(code: string | undefined) {
  return useQuery({
    queryKey: kontrakKaryawanKeys.detail(code ?? ""),
    queryFn: () => fetchOne<KontrakKaryawan>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidateKontrak(code?: string) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: kontrakKaryawanKeys.lists() }),
      queryClient.invalidateQueries({
        queryKey: kontrakKaryawanKeys.detail(code ?? ""),
        refetchType: "none",
      }),
    ]);
}

export function useSaveKontrak(code?: string) {
  const onInvalidate = useInvalidateKontrak(code);

  return useMutation({
    mutationFn: (payload: KontrakKaryawanPayload) =>
      fetchOne<KontrakKaryawan>(code ? pathOf(code) : BASE, {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteKontrak(code: string | undefined) {
  const onInvalidate = useInvalidateKontrak(code);

  return useMutation({
    mutationFn: () =>
      fetchOne<KontrakKaryawan>(pathOf(code ?? ""), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

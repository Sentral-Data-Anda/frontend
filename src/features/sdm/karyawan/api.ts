"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { SelectOption } from "@/components/common/control";
import { ddlKeys, useDdlSearch } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { Karyawan, KaryawanPayload } from "./types";

export const karyawanKeys = {
  all: ["karyawan"] as const,
  lists: () => [...karyawanKeys.all, "list"] as const,
  detail: (code: string) => [...karyawanKeys.all, "detail", code] as const,
};

const karyawanPath = (code?: string) =>
  code ? `/karyawan/${encodeURIComponent(code)}` : "/karyawan";

function useInvalidateKaryawan() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: karyawanKeys.all }),
      queryClient.invalidateQueries({ queryKey: ddlKeys.all }),
    ]);
}

export function useKaryawanList(params: ListState) {
  return useListQuery({
    queryKey: karyawanKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Karyawan>(`/karyawan?${apiQuery}`),
    params,
  });
}

export function useKaryawanDetail(code: string | undefined) {
  return useQuery({
    queryKey: karyawanKeys.detail(code ?? ""),
    queryFn: () => fetchOne<Karyawan>(karyawanPath(code)),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useSaveKaryawan(code?: string) {
  const onInvalidate = useInvalidateKaryawan();

  return useMutation({
    mutationFn: (payload: KaryawanPayload) =>
      fetchOne<Karyawan>(karyawanPath(code), {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteKaryawan(code: string | undefined) {
  const onInvalidate = useInvalidateKaryawan();

  return useMutation({
    mutationFn: () =>
      fetchOne<Karyawan>(karyawanPath(code), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

export const useJemaatOptions = (pinned: SelectOption | null) =>
  useDdlSearch("jemaat", "id", pinned);

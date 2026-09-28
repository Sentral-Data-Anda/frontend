"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys, useDdlOptions, useDdlSearch } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { IS_ACTIVE_PARAM } from "./model";
import type {
  PelayanDetail,
  PelayanListItem,
  PelayanPayload,
  PelayanSaved,
} from "./types";

export const daftarPelayanKeys = {
  all: ["daftar-pelayan"] as const,
  lists: () => [...daftarPelayanKeys.all, "list"] as const,
  detail: (code: string) => [...daftarPelayanKeys.all, "detail", code] as const,
};

export function useDaftarPelayanList(params: ListState) {
  return useListQuery({
    queryKey: daftarPelayanKeys.lists(),
    fetchPage: (apiQuery) => fetchList<PelayanListItem>(`/pelayan?${apiQuery}`),
    params: { ...params, status: IS_ACTIVE_PARAM[params.status] ?? "" },
  });
}

export function usePelayanDetail(code: string | undefined) {
  return useQuery({
    queryKey: daftarPelayanKeys.detail(code ?? ""),
    queryFn: () => fetchOne<PelayanDetail>(`/pelayan/${code}`),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidatePelayan(code: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: daftarPelayanKeys.lists() }),
      queryClient.invalidateQueries({
        queryKey: daftarPelayanKeys.detail(code ?? ""),
        refetchType: "none",
      }),
      queryClient.invalidateQueries({ queryKey: ["jadwal-pelayan"] }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.all,
        refetchType: "none",
      }),
    ]);
}

export function useSavePelayan(code?: string) {
  const onInvalidate = useInvalidatePelayan(code);

  return useMutation({
    mutationFn: (payload: PelayanPayload) =>
      fetchOne<{ code: string }>(code ? `/pelayan/${code}` : "/pelayan", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }) as Promise<PelayanSaved>,
    onSuccess: onInvalidate,
  });
}

export function useDeletePelayan(code: string | undefined) {
  const onInvalidate = useInvalidatePelayan(code);

  return useMutation({
    mutationFn: () =>
      fetchOne<unknown>(`/pelayan/${code}`, { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

const byLabel = (a: { label: string }, b: { label: string }) =>
  a.label.localeCompare(b.label, "id");

export function useFilterOptions(path: string, allLabel: string) {
  const ddl = useDdlOptions(path, "id");

  return {
    ...ddl,
    options: [
      { value: "", label: allLabel },
      ...[...ddl.options].sort(byLabel),
    ],
  };
}

export const useActiveJemaatSearch = () =>
  useDdlSearch("jemaat?status=AKTIF", "id");

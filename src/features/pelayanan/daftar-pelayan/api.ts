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
  // The row's uuid, as the contract says: the business code is only an alias
  // the backend still accepts for older links.
  detail: (publicId: string) =>
    [...daftarPelayanKeys.all, "detail", publicId] as const,
};

const pathOf = (key: string) => `/pelayan/${encodeURIComponent(key)}`;

export function useDaftarPelayanList(params: ListState) {
  return useListQuery({
    queryKey: daftarPelayanKeys.lists(),
    fetchPage: (apiQuery) => fetchList<PelayanListItem>(`/pelayan?${apiQuery}`),
    params: { ...params, status: IS_ACTIVE_PARAM[params.status] ?? "" },
  });
}

export function usePelayanDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: daftarPelayanKeys.detail(publicId ?? ""),
    queryFn: () => fetchOne<PelayanDetail>(pathOf(publicId ?? "")),
    enabled: Boolean(publicId),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidatePelayan(publicId: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: daftarPelayanKeys.lists() }),
      queryClient.invalidateQueries({
        queryKey: daftarPelayanKeys.detail(publicId ?? ""),
        refetchType: "none",
      }),
      queryClient.invalidateQueries({ queryKey: ["jadwal-pelayan"] }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.all,
        refetchType: "none",
      }),
    ]);
}

export function useSavePelayan(publicId?: string) {
  const onInvalidate = useInvalidatePelayan(publicId);

  return useMutation({
    mutationFn: (payload: PelayanPayload) =>
      fetchOne<{ code: string }>(publicId ? pathOf(publicId) : "/pelayan", {
        method: publicId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }) as Promise<PelayanSaved>,
    onSuccess: onInvalidate,
  });
}

export function useDeletePelayan(publicId: string | undefined) {
  const onInvalidate = useInvalidatePelayan(publicId);

  return useMutation({
    mutationFn: () =>
      fetchOne<unknown>(pathOf(publicId ?? ""), { method: "DELETE" }),
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

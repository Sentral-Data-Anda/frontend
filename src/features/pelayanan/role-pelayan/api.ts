"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { RolePelayan, RolePelayanPayload } from "./types";

export const rolePelayanKeys = {
  all: ["role-pelayan"] as const,
  lists: () => [...rolePelayanKeys.all, "list"] as const,
  detail: (id: string) => [...rolePelayanKeys.all, "detail", id] as const,
};

const DAFTAR_PELAYAN_LIST_KEY = ["daftar-pelayan", "list"] as const;
const TEMPLATE_JADWAL_LIST_KEY = ["template-jadwal", "list"] as const;
const JADWAL_PELAYAN_KEY = ["jadwal-pelayan"] as const;

const pathOf = (key: string) => `/role-pelayan/${encodeURIComponent(key)}`;

export function useRolePelayanList(params: ListState) {
  return useListQuery({
    queryKey: rolePelayanKeys.lists(),
    fetchPage: (apiQuery) =>
      fetchList<RolePelayan>(`/role-pelayan?${apiQuery}`),
    params: { ...params, status: "" },
  });
}

export function useRolePelayanDetail(id: string | undefined) {
  return useQuery({
    queryKey: rolePelayanKeys.detail(id ?? ""),
    queryFn: () => fetchOne<RolePelayan>(pathOf(id ?? "")),
    enabled: Boolean(id),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidateRolePelayan(id: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: rolePelayanKeys.lists() }),
      // Tanpa refetch: form yang masih terpasang akan membaca 404 sesudah hapus.
      queryClient.invalidateQueries({
        queryKey: rolePelayanKeys.detail(id ?? ""),
        refetchType: "none",
      }),
      queryClient.invalidateQueries({ queryKey: ddlKeys.list("role-pelayan") }),
      queryClient.invalidateQueries({ queryKey: DAFTAR_PELAYAN_LIST_KEY }),
      queryClient.invalidateQueries({ queryKey: TEMPLATE_JADWAL_LIST_KEY }),
      queryClient.invalidateQueries({ queryKey: JADWAL_PELAYAN_KEY }),
    ]);
}

export function useSaveRolePelayan(id?: string) {
  const onInvalidate = useInvalidateRolePelayan(id);

  return useMutation({
    mutationFn: (payload: RolePelayanPayload) =>
      fetchOne<RolePelayan>(id ? pathOf(id) : "/role-pelayan", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteRolePelayan(id: string | undefined) {
  const onInvalidate = useInvalidateRolePelayan(id);

  return useMutation({
    mutationFn: () => fetchOne<unknown>(pathOf(id ?? ""), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

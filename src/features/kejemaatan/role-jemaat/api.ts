"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useDdlOptions, useDdlSearch } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { RoleJemaatItem, RoleJemaatPayload } from "./types";

export const roleJemaatKeys = {
  all: ["role-jemaat"] as const,
  lists: () => [...roleJemaatKeys.all, "list"] as const,
  detail: (id: string) => [...roleJemaatKeys.all, "detail", id] as const,
};

const pathOf = (key: string) => `/role-jemaat/${encodeURIComponent(key)}`;

export function useRoleJemaatList(params: ListState) {
  return useListQuery({
    queryKey: roleJemaatKeys.lists(),
    fetchPage: (apiQuery) =>
      fetchList<RoleJemaatItem>(`/role-jemaat?${apiQuery}`),
    params,
  });
}

export function useRoleJemaatDetail(id: string | undefined) {
  return useQuery({
    queryKey: roleJemaatKeys.detail(id ?? ""),
    queryFn: () => fetchOne<RoleJemaatItem>(pathOf(id ?? "")),
    enabled: Boolean(id),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useSaveRoleJemaat(id?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RoleJemaatPayload) =>
      fetchOne<{ id: number }>(id ? pathOf(id) : "/role-jemaat", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: roleJemaatKeys.lists() }),
  });
}

export function useDeleteRoleJemaat(id?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchOne<{ id: number }>(pathOf(id ?? ""), { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: roleJemaatKeys.lists() }),
  });
}

export const useJemaatOptions = (saved?: RoleJemaatItem["jemaat"]) =>
  useDdlSearch(
    "jemaat",
    "id",
    saved ? { value: String(saved.id), label: saved.name } : null,
  );

export const useBapelOptions = () => useDdlOptions("bapel");

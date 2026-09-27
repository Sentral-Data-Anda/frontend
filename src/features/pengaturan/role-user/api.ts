"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type {
  MenuOption,
  RoleUserDetail,
  RoleUserItem,
  RoleUserPayload,
} from "./types";

export const roleUserKeys = {
  all: ["role-user"] as const,
  lists: () => [...roleUserKeys.all, "list"] as const,
  detail: (id: string) => [...roleUserKeys.all, "detail", id] as const,
  menuOptions: () => [...roleUserKeys.all, "menu-options"] as const,
};

export function useRoleUserList(params: ListState) {
  return useListQuery({
    queryKey: roleUserKeys.lists(),
    fetchPage: (apiQuery) => fetchList<RoleUserItem>(`/role?${apiQuery}`),
    params,
  });
}

export function useRoleUserDetail(id: string | undefined) {
  return useQuery({
    queryKey: roleUserKeys.detail(id ?? ""),
    queryFn: () => fetchOne<RoleUserDetail>(`/role/${id}`),
    enabled: Boolean(id),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useMenuOptions() {
  return useQuery({
    queryKey: roleUserKeys.menuOptions(),
    queryFn: () => fetchOne<MenuOption[]>("/role/menu-options"),
    select: (response) => response.data,
  });
}

export function useSaveRoleUser(id?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RoleUserPayload) =>
      fetchOne<RoleUserItem>(id ? `/role/${id}` : "/role", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: roleUserKeys.lists() }),
  });
}

export function useDeleteRoleUser(id: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fetchOne<unknown>(`/role/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: roleUserKeys.lists() }),
  });
}

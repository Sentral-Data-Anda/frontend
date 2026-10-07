"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys, useDdlOptions, useDdlSearch } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type {
  UserCredential,
  UserDetail,
  UserListItem,
  UserPayload,
} from "./types";

export const userKeys = {
  all: ["user"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  detail: (code: string) => [...userKeys.all, "detail", code] as const,
};

const pathOf = (code: string, base = "/user") =>
  `${base}/${encodeURIComponent(code)}`;

export function useUserList(params: ListState) {
  return useListQuery({
    queryKey: userKeys.lists(),
    fetchPage: (apiQuery) => fetchList<UserListItem>(`/user?${apiQuery}`),
    params,
  });
}

export function useUserDetail(code: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(code ?? ""),
    queryFn: () => fetchOne<UserDetail>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useUserMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    gcTime: 0,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: userKeys.all }),
        queryClient.invalidateQueries({ queryKey: ddlKeys.all }),
      ]),
  });
}

export const useSaveUser = (code?: string) =>
  useUserMutation((payload: UserPayload) =>
    fetchOne<UserCredential>(code ? pathOf(code) : "/user", {
      method: code ? "PUT" : "POST",
      body: JSON.stringify(payload),
    }),
  );

export const useResetUser = (code?: string) =>
  useUserMutation(() =>
    fetchOne<UserCredential>(pathOf(code ?? "", "/user/reset"), {
      method: "PUT",
    }),
  );

export const useRestoreUser = (code?: string) =>
  useUserMutation(() =>
    fetchOne<UserCredential>(pathOf(code ?? "", "/user/restore"), {
      method: "PUT",
    }),
  );

export const useDeactivateUser = (code?: string) =>
  useUserMutation(() =>
    fetchOne<unknown>(pathOf(code ?? ""), { method: "DELETE" }),
  );

export const useUnregisteredJemaatOptions = () =>
  useDdlSearch("jemaat?register=0", "id");

export const useAssignableRoleOptions = () =>
  useDdlOptions("role-user?assignable=1");

export function useRoleFilterOptions() {
  const roles = useDdlOptions("role-user");

  return {
    ...roles,
    options: [{ value: "", label: "Semua role" }, ...roles.options],
  };
}

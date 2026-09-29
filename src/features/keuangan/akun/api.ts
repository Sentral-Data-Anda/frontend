"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListFilterSchema, ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { Account, AccountPayload } from "./types";

export const accountKeys = {
  all: ["account"] as const,
  lists: () => [...accountKeys.all, "list"] as const,
  detail: (code: string) => [...accountKeys.all, "detail", code] as const,
  children: (id: number) => [...accountKeys.all, "children", id] as const,
};

export const ACCOUNT_FILTERS = {
  tipe: { api: "type" },
  aktif: { api: "isActive" },
} satisfies ListFilterSchema;

const accountPath = (code?: string) =>
  code ? `/account/${encodeURIComponent(code)}` : "/account";

export const isAccountDdl = (key: readonly unknown[]) =>
  String(key[1]).startsWith("account");

export function useAccountList(params: ListState) {
  return useListQuery({
    queryKey: accountKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Account>(`/account?${apiQuery}`),
    params: { ...params, status: "" },
  });
}

export function useAccountDetail(code: string | undefined) {
  return useQuery({
    queryKey: accountKeys.detail(code ?? ""),
    queryFn: () => fetchOne<Account>(accountPath(code)),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useAccountChildren(parentAccountId: number | undefined) {
  return useQuery({
    queryKey: accountKeys.children(parentAccountId ?? 0),
    queryFn: () =>
      fetchList<Account>(
        `/account?parentAccountId=${parentAccountId}&limit=100`,
      ),
    enabled: Boolean(parentAccountId),
    select: (response) => response.data,
  });
}

function useInvalidateAccount() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: accountKeys.all,
        predicate: (query) => query.queryKey[1] !== "detail",
      }),
      queryClient.invalidateQueries({
        queryKey: accountKeys.all,
        refetchType: "none",
        predicate: (query) => query.queryKey[1] === "detail",
      }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.all,
        predicate: (query) => isAccountDdl(query.queryKey),
      }),
    ]);
}

export function useSaveAccount(code?: string) {
  const onInvalidate = useInvalidateAccount();

  return useMutation({
    mutationFn: (payload: AccountPayload) =>
      fetchOne<Account>(accountPath(code), {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteAccount(code: string | undefined) {
  const onInvalidate = useInvalidateAccount();

  return useMutation({
    mutationFn: () =>
      fetchOne<unknown>(accountPath(code), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

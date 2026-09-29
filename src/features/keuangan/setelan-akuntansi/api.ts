"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { AccountingSetting, AccountingSettingPayload } from "./types";

export const settingKeys = {
  all: ["accounting-setting"] as const,
  list: () => [...settingKeys.all, "list"] as const,
};

export function useSettingList() {
  const query = useQuery({
    queryKey: settingKeys.list(),
    queryFn: () => fetchList<AccountingSetting>("/setelan-akuntansi"),
    staleTime: 0,
    select: (response) => response.data,
  });

  return {
    settings: query.data ?? [],
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.error,
    onRetry: () => void query.refetch(),
  };
}

export function useSaveSetting(key: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AccountingSettingPayload) =>
      fetchOne<AccountingSetting>(
        `/setelan-akuntansi/${encodeURIComponent(key ?? "")}`,
        { method: "PUT", body: JSON.stringify(payload) },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: settingKeys.all }),
  });
}

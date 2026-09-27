"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys, useDdlOptions } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { toSetelanQuery } from "./model";
import type { JabatanRow, SetelanItem, SetelanPayload } from "./types";

export const setelanKeys = {
  all: ["setelan-persetujuan"] as const,
  lists: () => [...setelanKeys.all, "list"] as const,
  detail: (id: string) => [...setelanKeys.all, "detail", id] as const,
};

export function useSetelanList(params: ListState) {
  return useListQuery({
    queryKey: setelanKeys.lists(),
    fetchPage: (apiQuery) =>
      fetchList<SetelanItem>(
        `/setelan-persetujuan?${toSetelanQuery(apiQuery)}`,
      ),
    params,
  });
}

export function useSetelanDetail(id: string | undefined) {
  return useQuery({
    queryKey: setelanKeys.detail(id ?? ""),
    queryFn: () => fetchOne<SetelanItem>(`/setelan-persetujuan/${id}`),
    enabled: Boolean(id),
    staleTime: 0,
    select: (response) => response.data,
  });
}

const useInvalidate = (id?: string) => {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: setelanKeys.lists() }),
      id
        ? queryClient.invalidateQueries({ queryKey: setelanKeys.detail(id) })
        : null,
    ]);
};

export function useSaveSetelan(id?: string) {
  const onInvalidate = useInvalidate(id);

  return useMutation({
    mutationFn: (payload: SetelanPayload) =>
      fetchOne<SetelanItem>(
        id ? `/setelan-persetujuan/${id}` : "/setelan-persetujuan",
        { method: id ? "PUT" : "POST", body: JSON.stringify(payload) },
      ),
    onSuccess: onInvalidate,
  });
}

export function useDeactivateSetelan(id?: string) {
  const onInvalidate = useInvalidate(id);

  return useMutation({
    mutationFn: () =>
      fetchOne<undefined>(`/setelan-persetujuan/${id}`, { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

export const useBapelOptions = () => useDdlOptions("bapel", "id");

export const useRoleOptions = () => useDdlOptions("role-user", "id");

export function useJabatanOptions(bapelId: string, isEnabled = true) {
  const query = useQuery({
    enabled: isEnabled,
    queryKey: [...ddlKeys.all, "jabatan-jemaat", bapelId],
    queryFn: () =>
      fetchList<JabatanRow>(
        bapelId
          ? `/ddl/jabatan-jemaat?bapelId=${encodeURIComponent(bapelId)}`
          : "/ddl/jabatan-jemaat",
      ),
    staleTime: 10 * 60_000,
    select: (response) =>
      response.data.map((row) => ({ value: row.name, label: row.name })),
  });

  return { options: query.data ?? [], isLoading: query.isFetching };
}

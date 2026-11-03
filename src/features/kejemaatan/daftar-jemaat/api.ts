"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ddlKeys,
  useDdlOptions,
  useDdlSearch,
  type DdlOption,
} from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { JemaatDetail, JemaatListItem, JemaatPayload } from "./types";

export const jemaatKeys = {
  all: ["jemaat"] as const,
  lists: () => [...jemaatKeys.all, "list"] as const,
  detail: (code: string) => [...jemaatKeys.all, "detail", code] as const,
};

const pathOf = (key: string) => `/jemaat/${encodeURIComponent(key)}`;

export function useJemaatList(params: ListState) {
  return useListQuery({
    queryKey: jemaatKeys.lists(),
    fetchPage: (apiQuery) => fetchList<JemaatListItem>(`/jemaat?${apiQuery}`),
    params,
  });
}

export function useJemaatDuplicates(name: string, birthDate: string) {
  return useQuery({
    queryKey: [...jemaatKeys.lists(), "duplikat", name],
    queryFn: () =>
      fetchList<JemaatListItem>(
        `/jemaat?filter=${encodeURIComponent(name.trim())}&limit=5`,
      ),
    enabled: Boolean(name.trim() && birthDate),
    staleTime: 60_000,
    select: (response) => response.data,
  });
}

export function useJemaatDetail(code: string | undefined) {
  return useQuery({
    queryKey: jemaatKeys.detail(code ?? ""),
    queryFn: () => fetchOne<JemaatDetail>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useSaveJemaat(code?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: JemaatPayload) =>
      fetchOne<{ code: string }>(code ? pathOf(code) : "/jemaat", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: jemaatKeys.lists() }),
  });
}

export function useZoneFilterOptions(keepValue: string) {
  const zones = useDdlOptions("zone-church", "id", keepValue);

  return {
    ...zones,
    options: [
      { value: "", label: "Semua wilayah" },
      ...[...zones.options].sort((a, b) =>
        a.label.localeCompare(b.label, "id"),
      ),
    ],
  };
}

export const useKeluargaOptions = () => useDdlSearch("keluarga");

export type MasterKind = "profession" | "ethnic-group";

export function useCreateMaster(kind: MasterKind) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      fetchOne<DdlOption>(`/${kind}`, {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ddlKeys.list(kind) }),
  });
}

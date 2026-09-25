"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type {
  DdlOption,
  JemaatDetail,
  JemaatListItem,
  JemaatPayload,
} from "./types";

export const jemaatKeys = {
  all: ["jemaat"] as const,
  lists: () => [...jemaatKeys.all, "list"] as const,
  detail: (code: string) => [...jemaatKeys.all, "detail", code] as const,
};

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
    queryFn: () => fetchOne<JemaatDetail>(`/jemaat/${code}`),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useSaveJemaat(code?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: JemaatPayload) =>
      fetchOne<{ code: string }>(code ? `/jemaat/${code}` : "/jemaat", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: jemaatKeys.lists() }),
  });
}

export const ddlKeys = {
  all: ["ddl"] as const,
  list: (path: string) => [...ddlKeys.all, path] as const,
};

export function useDdlOptions(
  path: string | null,
  valueKey: "id" | "code" = "id",
) {
  const query = useQuery({
    queryKey: ddlKeys.list(path ?? ""),
    queryFn: () => fetchList<DdlOption>(`/ddl/${path}`),
    enabled: path !== null,
    staleTime: 10 * 60_000,
    select: (response) =>
      response.data.map((row) => ({
        value: String(row[valueKey]),
        label: row.name,
      })),
  });

  return {
    options: query.data ?? [],
    isLoading: query.isFetching,
  };
}

export function useZoneFilterOptions() {
  const zones = useDdlOptions("zone-church");

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

export function useKeluargaOptions() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    if (query === debounced) return;

    const timer = setTimeout(() => setDebounced(query), 300);

    return () => clearTimeout(timer);
  }, [query, debounced]);

  const ddl = useDdlOptions(
    `keluarga?limit=20${debounced ? `&filter=${encodeURIComponent(debounced)}` : ""}`,
  );

  return { ...ddl, onSearch: setQuery };
}

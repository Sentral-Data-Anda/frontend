"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { fetchList } from "@/lib/api/fetcher";

export type DdlOption = {
  id: number;
  code: string;
  name: string;
};

type ValueKey = "id" | "code";

export const ddlKeys = {
  all: ["ddl"] as const,
  list: (path: string) => [...ddlKeys.all, path] as const,
};

export function useDdlOptions(path: string | null, valueKey: ValueKey = "id") {
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

export function useDdlSearch(resource: string, valueKey: ValueKey = "id") {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  const ddl = useDdlOptions(
    `${resource}?limit=20${debounced ? `&filter=${encodeURIComponent(debounced)}` : ""}`,
    valueKey,
  );

  useEffect(() => {
    if (query === debounced) return;

    const timer = setTimeout(() => setDebounced(query), 300);

    return () => clearTimeout(timer);
  }, [query, debounced]);

  return { ...ddl, onSearch: setQuery };
}

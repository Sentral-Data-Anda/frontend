"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { SelectOption } from "@/components/common/control";
import { fetchList } from "@/lib/api/fetcher";

export type DdlOption = {
  id: number;
  code: string;
  name: string;
  isActive?: boolean;
};

type ValueKey = "id" | "code";

export const ddlKeys = {
  all: ["ddl"] as const,
  list: (path: string) => [...ddlKeys.all, path] as const,
};

export const toDdlOptions = (
  rows: DdlOption[],
  valueKey: ValueKey,
  keepValue = "",
): SelectOption[] =>
  rows
    .filter(
      (row) => row.isActive !== false || String(row[valueKey]) === keepValue,
    )
    .map((row) => ({
      value: String(row[valueKey]),
      label: row.isActive === false ? `${row.name} (nonaktif)` : row.name,
    }));

function useDdlQuery(
  path: string | null,
  valueKey: ValueKey,
  isKeepingPrevious: boolean,
  keepValue = "",
) {
  const query = useQuery({
    queryKey: ddlKeys.list(path ?? ""),
    queryFn: () => fetchList<DdlOption>(`/ddl/${path}`),
    enabled: path !== null,
    staleTime: 10 * 60_000,
    placeholderData: isKeepingPrevious ? keepPreviousData : undefined,
    select: (response) => toDdlOptions(response.data, valueKey, keepValue),
  });

  return {
    options: query.data ?? [],
    isLoading: query.isFetching,
  };
}

export const useDdlOptions = (
  path: string | null,
  valueKey: ValueKey = "id",
  keepValue = "",
) => useDdlQuery(path, valueKey, false, keepValue);

export function useDdlSearch(
  resource: string,
  valueKey: ValueKey = "id",
  pinned: SelectOption | null = null,
) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  const ddl = useDdlQuery(
    `${resource}?limit=20${debounced ? `&filter=${encodeURIComponent(debounced)}` : ""}`,
    valueKey,
    true,
  );

  const isPinnedMissing =
    pinned !== null &&
    !ddl.options.some((option) => option.value === pinned.value);

  useEffect(() => {
    if (query === debounced) return;

    const timer = setTimeout(() => setDebounced(query), 300);

    return () => clearTimeout(timer);
  }, [query, debounced]);

  return {
    ...ddl,
    options: isPinnedMissing ? [pinned, ...ddl.options] : ddl.options,
    onSearch: setQuery,
  };
}

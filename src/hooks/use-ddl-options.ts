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

export type HintOf<T extends DdlOption> = (row: T) => string;

export const ddlKeys = {
  all: ["ddl"] as const,
  list: (path: string) => [...ddlKeys.all, path] as const,
};

export const toDdlOptions = <T extends DdlOption>(
  rows: T[],
  valueKey: ValueKey,
  keepValue = "",
  hintOf?: HintOf<T>,
): SelectOption[] =>
  rows
    .filter(
      (row) => row.isActive !== false || String(row[valueKey]) === keepValue,
    )
    .map((row) => ({
      value: String(row[valueKey]),
      label: row.isActive === false ? `${row.name} (nonaktif)` : row.name,
      ...(hintOf ? { hint: hintOf(row) } : {}),
    }));

export const ddlSearchPath = (resource: string, query: string) =>
  `${resource}${resource.includes("?") ? "&" : "?"}limit=20${query ? `&filter=${encodeURIComponent(query)}` : ""}`;

function useDdlQuery<T extends DdlOption>(
  path: string | null,
  valueKey: ValueKey,
  isKeepingPrevious: boolean,
  keepValue = "",
  hintOf?: HintOf<T>,
) {
  const query = useQuery({
    queryKey: ddlKeys.list(path ?? ""),
    queryFn: () => fetchList<T>(`/ddl/${path}`),
    enabled: path !== null,
    staleTime: 10 * 60_000,
    placeholderData: isKeepingPrevious ? keepPreviousData : undefined,
    select: (response) => ({
      rows: response.data,
      options: toDdlOptions(response.data, valueKey, keepValue, hintOf),
    }),
  });

  return {
    rows: query.data?.rows ?? [],
    options: query.data?.options ?? [],
    isLoading: query.isFetching,
  };
}

export const useDdlOptions = <T extends DdlOption = DdlOption>(
  path: string | null,
  valueKey: ValueKey = "id",
  keepValue = "",
  hintOf?: HintOf<T>,
) => useDdlQuery(path, valueKey, false, keepValue, hintOf);

export function useDdlSearch<T extends DdlOption = DdlOption>(
  resource: string,
  valueKey: ValueKey = "id",
  pinned: SelectOption | null = null,
  hintOf?: HintOf<T>,
) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  const ddl = useDdlQuery(
    ddlSearchPath(resource, debounced),
    valueKey,
    true,
    "",
    hintOf,
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

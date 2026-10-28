"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import type { SelectOption } from "@/components/common/control";
import { useBoolean } from "@/hooks/use-boolean";
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

export type UseDdlSearchResult<T extends DdlOption = DdlOption> = {
  rows: T[];
  options: SelectOption[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onSearch: (query: string) => void;
  onLoadMore: () => void;
};

export function useDdlSearch<T extends DdlOption = DdlOption>(
  resource: string,
  valueKey: ValueKey = "id",
  pinned: SelectOption | null = null,
  hintOf?: HintOf<T>,
): UseDdlSearchResult<T> {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  const initial = useDdlQuery(
    ddlSearchPath(resource, debounced),
    valueKey,
    true,
    "",
    hintOf,
  );

  const [allOptions, setAllOptions] = useState<SelectOption[]>([]);
  const isHasMore = useBoolean(false);
  const isLoadingMore = useBoolean(false);
  const abortRef = useRef(false);

  const pageSize = 20;

  // Reset when query changes

  useEffect(() => {
    const timer = setTimeout(() => {
      setAllOptions(initial.options);
      isHasMore.setValue(initial.options.length >= pageSize);
    }, 0);
    return () => clearTimeout(timer);
  }, [initial.options, debounced]);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(timer);
  }, [query, setDebounced]);

  const isPinnedMissing =
    pinned !== null &&
    !allOptions.some((option) => option.value === pinned.value);

  const options = isPinnedMissing ? [pinned, ...allOptions] : allOptions;

  const onLoadMore = async () => {
    if (isLoadingMore.value || !isHasMore.value || abortRef.current) return;

    isLoadingMore.setValue(true);
    abortRef.current = false;
    try {
      const nextLimit = allOptions.length + pageSize;
      const path = `${resource}${resource.includes("?") ? "&" : "?"}limit=${nextLimit}${debounced ? `&filter=${encodeURIComponent(debounced)}` : ""}`;

      const result = await fetchList<T>(`/ddl/${path}`);
      const newOptions = toDdlOptions(result.data, valueKey, "", hintOf);

      if (abortRef.current) return;

      setAllOptions((prev) => {
        const map = new Map(prev.map((option) => [option.value, option]));
        for (const option of newOptions) {
          map.set(option.value, option);
        }
        return [...map.values()];
      });

      isHasMore.setValue(newOptions.length >= pageSize);
    } finally {
      if (!abortRef.current) {
        isLoadingMore.setValue(false);
      }
    }
  };

  const onSearch = (next: string) => {
    setQuery(next);
    abortRef.current = true;
  };

  return {
    rows: initial.rows,
    options,
    isLoading: initial.isLoading,
    hasMore: isHasMore.value,
    isLoadingMore: isLoadingMore.value,
    onSearch,
    onLoadMore,
  };
}

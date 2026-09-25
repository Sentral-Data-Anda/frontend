"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

import { saveListReturn } from "@/lib/list-return";

// Sama dengan DEFAULT_PAGE_SIZE di be-sada.
export const DEFAULT_LIMIT = 10;

export type ListParams = {
  page: number;
  limit: number;
  search: string;
  status: string;
  apiFilters?: Record<string, string>;
};

export type ListFilterSchema = Record<string, { api: string }>;

const NO_FILTERS: ListFilterSchema = {};

const onReadNumber = (value: string | null, fallback: number): number => {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export function toApiQuery(params: ListParams): string {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search) query.set("filter", params.search);
  if (params.status) query.set("status", params.status);

  for (const [api, value] of Object.entries(params.apiFilters ?? {})) {
    if (value) query.set(api, value);
  }

  return query.toString();
}

export function useListParams({
  limit: limitPerPage = DEFAULT_LIMIT,
  filters: schema = NO_FILTERS,
}: {
  limit?: number;
  filters?: ListFilterSchema;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(() => {
    const filters = Object.fromEntries(
      Object.keys(schema).map((key) => [key, searchParams.get(key) ?? ""]),
    );

    return {
      page: onReadNumber(searchParams.get("page"), 1),
      limit: onReadNumber(searchParams.get("limit"), limitPerPage),
      search: searchParams.get("search") ?? "",
      status: searchParams.get("status") ?? "",
      filters,
      apiFilters: Object.fromEntries(
        Object.entries(schema).map(([key, { api }]) => [api, filters[key]]),
      ),
    } satisfies ListParams & { filters: Record<string, string> };
  }, [limitPerPage, schema, searchParams]);

  const query = searchParams.toString();

  useEffect(() => {
    saveListReturn(pathname, query ? `${pathname}?${query}` : pathname);
  }, [pathname, query]);

  const onWrite = useCallback(
    (next: Partial<ListParams>) => {
      // `searchParams` tertinggal satu render sesudah router.replace.
      const url = new URLSearchParams(window.location.search);

      for (const [key, value] of Object.entries(next)) {
        const text = String(value);

        if (
          !value ||
          (key === "page" && value === 1) ||
          (key === "limit" && value === limitPerPage)
        )
          url.delete(key);
        else url.set(key, text);
      }

      const query = url.toString();

      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [limitPerPage, pathname, router],
  );

  const onSearch = useCallback(
    (search: string) => onWrite({ search, page: 1 }),
    [onWrite],
  );

  const onPickStatus = useCallback(
    (status: string) => onWrite({ status, page: 1 }),
    [onWrite],
  );

  const onPickPage = useCallback(
    (page: number) => onWrite({ page }),
    [onWrite],
  );

  const onPickLimit = useCallback(
    (limit: number) => onWrite({ limit, page: 1 }),
    [onWrite],
  );

  const onPickFilter = useCallback(
    (key: string, value: string) => onWrite({ [key]: value, page: 1 }),
    [onWrite],
  );

  return {
    ...params,
    onSearch,
    onPickStatus,
    onPickPage,
    onPickLimit,
    onPickFilter,
  };
}

export type ListState = ReturnType<typeof useListParams>;

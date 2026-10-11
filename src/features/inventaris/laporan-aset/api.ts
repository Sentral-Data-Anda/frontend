"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchOne } from "@/lib/api/fetcher";

import type { AssetRegister, AssetRegisterRow } from "./types";

const BASE = "/laporan-aset";

const STALE_TIME = 60 * 1000;

// Batas yang sama dengan MAX_PAGE_SIZE di be-sada; di atasnya dipangkas diam-diam.
const FULL_PAGE = 100;

const toQuery = (date: string, page: number, limit: number) =>
  new URLSearchParams({
    date,
    page: String(page),
    limit: String(limit),
  }).toString();

export const assetRegisterKeys = {
  all: ["asset-register"] as const,
  list: (query: string) => [...assetRegisterKeys.all, query] as const,
};

export function useAssetRegister(params: {
  date: string;
  page: number;
  limit: number;
}) {
  const query = toQuery(params.date, params.page, params.limit);

  return useQuery({
    queryKey: assetRegisterKeys.list(query),
    queryFn: () => fetchOne<AssetRegister>(`${BASE}?${query}`),
    enabled: Boolean(params.date),
    staleTime: STALE_TIME,
    select: (response) => response.data,
  });
}

/**
 * Seluruh baris register pada tanggal itu, bukan halamannya.
 *
 * CSV berisi sepuluh aset pertama tidak bisa dicocokkan dengan neraca, dan
 * mencocokkannya itulah gunanya berkas ini.
 */
export async function fetchAllRegisterRows(
  date: string,
): Promise<AssetRegisterRow[]> {
  const collected: AssetRegisterRow[] = [];
  let page = 1;
  let totalPage = 1;

  while (page <= totalPage && page <= 500) {
    const response = await fetchOne<AssetRegister>(
      `${BASE}?${toQuery(date, page, FULL_PAGE)}`,
    );

    collected.push(...response.data.rows);
    totalPage = response.data.totalPage;
    page += 1;
  }

  return collected;
}

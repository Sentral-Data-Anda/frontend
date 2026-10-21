"use client";

import { useQuery } from "@tanstack/react-query";

import type { ListLimit } from "@/hooks/use-list-params";
import { fetchOne } from "@/lib/api/fetcher";

import type {
  ArusKas,
  BukuBesar,
  LedgerRow,
  Neraca,
  PerubahanAsetNeto,
  SurplusDefisit,
} from "./types";

export const reportKeys = {
  all: ["financial-report"] as const,
  neraca: (date: string) => [...reportKeys.all, "neraca", date] as const,
  surplus: (from: string, to: string) =>
    [...reportKeys.all, "surplus-defisit", from, to] as const,
  ledger: (query: string) => [...reportKeys.all, "buku-besar", query] as const,
  asetNeto: (from: string, to: string) =>
    [...reportKeys.all, "perubahan-aset-neto", from, to] as const,
  arusKas: (from: string, to: string) =>
    [...reportKeys.all, "arus-kas", from, to] as const,
};

const STALE_TIME = 30_000;

const BASE = "/laporan-keuangan";

export function useNeraca(date: string) {
  return useQuery({
    queryKey: reportKeys.neraca(date),
    queryFn: () => fetchOne<Neraca>(`${BASE}/neraca?date=${date}`),
    enabled: Boolean(date),
    staleTime: STALE_TIME,
    select: (response) => response.data,
  });
}

export function useSurplusDefisit(from: string, to: string) {
  return useQuery({
    queryKey: reportKeys.surplus(from, to),
    queryFn: () =>
      fetchOne<SurplusDefisit>(`${BASE}/surplus-defisit?from=${from}&to=${to}`),
    enabled: Boolean(from && to),
    staleTime: STALE_TIME,
    select: (response) => response.data,
  });
}

export function usePerubahanAsetNeto(from: string, to: string) {
  return useQuery({
    queryKey: reportKeys.asetNeto(from, to),
    queryFn: () =>
      fetchOne<PerubahanAsetNeto>(
        `${BASE}/perubahan-aset-neto?from=${from}&to=${to}`,
      ),
    enabled: Boolean(from && to),
    staleTime: STALE_TIME,
    select: (response) => response.data,
  });
}

/**
 * Satu-satunya laporan di modul ini yang bisa MENOLAK: tanpa akun bertanda
 * kas, tidak ada yang bisa dijelaskan, dan nol akan dipercaya.
 */
export function useArusKas(from: string, to: string) {
  return useQuery({
    queryKey: reportKeys.arusKas(from, to),
    queryFn: () => fetchOne<ArusKas>(`${BASE}/arus-kas?from=${from}&to=${to}`),
    enabled: Boolean(from && to),
    staleTime: STALE_TIME,
    select: (response) => response.data,
  });
}

const ledgerQuery = (params: {
  code: string;
  from: string;
  to: string;
  page: number;
  limit: ListLimit;
}) =>
  new URLSearchParams({
    code: params.code,
    from: params.from,
    to: params.to,
    page: String(params.page),
    limit: String(params.limit),
  }).toString();

/**
 * Seluruh baris buku besar untuk rentangnya, bukan halaman yang terlihat.
 *
 * Buku besar sebulan saja sudah melewati satu halaman, dan CSV yang berisi
 * sepuluh baris pertama tidak bisa dipakai memeriksa apa pun.
 */
export async function fetchAllLedgerRows(params: {
  code: string;
  from: string;
  to: string;
}): Promise<LedgerRow[]> {
  const collected: LedgerRow[] = [];
  let page = 1;
  let totalPage = 1;

  // Batas yang sama dengan `MAX_PAGE_SIZE` di be-sada; di atasnya dipangkas.
  while (page <= totalPage && page <= 500) {
    const response = await fetchOne<BukuBesar>(
      `${BASE}/buku-besar?${ledgerQuery({ ...params, page, limit: 100 })}`,
    );

    collected.push(...response.data.rows);
    totalPage = response.data.totalPage;
    page += 1;
  }

  return collected;
}

export function useLedger(params: {
  code: string;
  from: string;
  to: string;
  page: number;
  limit: ListLimit;
}) {
  const query = ledgerQuery(params);

  return useQuery({
    queryKey: reportKeys.ledger(query),
    queryFn: () => fetchOne<BukuBesar>(`${BASE}/buku-besar?${query}`),
    enabled: Boolean(params.code && params.from && params.to),
    staleTime: STALE_TIME,
    select: (response) => response.data,
  });
}

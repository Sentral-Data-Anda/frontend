"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchOne } from "@/lib/api/fetcher";

import type { BukuBesar, Neraca, SurplusDefisit } from "./types";

export const reportKeys = {
  all: ["financial-report"] as const,
  neraca: (date: string) => [...reportKeys.all, "neraca", date] as const,
  surplus: (from: string, to: string) =>
    [...reportKeys.all, "surplus-defisit", from, to] as const,
  ledger: (query: string) => [...reportKeys.all, "buku-besar", query] as const,
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

export function useLedger(params: {
  code: string;
  from: string;
  to: string;
  page: number;
  limit: number;
}) {
  const query = new URLSearchParams({
    code: params.code,
    from: params.from,
    to: params.to,
    page: String(params.page),
    limit: String(params.limit),
  }).toString();

  return useQuery({
    queryKey: reportKeys.ledger(query),
    queryFn: () => fetchOne<BukuBesar>(`${BASE}/buku-besar?${query}`),
    enabled: Boolean(params.code && params.from && params.to),
    staleTime: STALE_TIME,
    select: (response) => response.data,
  });
}

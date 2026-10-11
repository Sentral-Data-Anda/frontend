"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchOne } from "@/lib/api/fetcher";

import type { ApAgeing } from "./types";

const BASE = "/laporan-utang";

export const apAgeingKeys = {
  all: ["ap-ageing"] as const,
  byDate: (date: string) => [...apAgeingKeys.all, date] as const,
};

export function useApAgeing(date: string) {
  return useQuery({
    queryKey: apAgeingKeys.byDate(date),
    queryFn: () =>
      fetchOne<ApAgeing>(`${BASE}?date=${encodeURIComponent(date)}`),
    enabled: Boolean(date),
    staleTime: 60 * 1000,
    select: (response) => response.data,
  });
}

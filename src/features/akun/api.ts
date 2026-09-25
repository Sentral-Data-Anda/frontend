"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { summarizeOfferings } from "./model";
import type { ChangePasswordPayload, OfferingItem } from "./types";

export const offeringKeys = {
  mine: (year: string) => ["persembahan", "saya", year] as const,
};

export function useMyOfferings(year: string, isEnabled: boolean) {
  return useQuery({
    queryKey: offeringKeys.mine(year),
    queryFn: () =>
      fetchList<OfferingItem>(
        `/persembahan/saya?periodStart=${year}-01&periodEnd=${year}-12&limit=100`,
      ),
    enabled: isEnabled,
    staleTime: 0,
    gcTime: 0,
    select: (response) => summarizeOfferings(response.data),
  });
}

export function useChangePassword(code: string) {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      fetchOne<null>(`/auth/change-password/${code}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  });
}

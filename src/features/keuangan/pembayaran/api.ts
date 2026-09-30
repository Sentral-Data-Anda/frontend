"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListFilterSchema, ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { toPaymentApiFilters } from "./model";
import type { Payment, PostingRange, PostingResult } from "./types";

export const paymentKeys = {
  all: ["payment"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  detail: (publicId: string) =>
    [...paymentKeys.all, "detail", publicId] as const,
};

export const PAYMENT_FILTERS = {
  bulan: { api: "bulan" },
  tujuan: { api: "purpose" },
} satisfies ListFilterSchema;

export function usePaymentList(params: ListState) {
  return useListQuery({
    queryKey: paymentKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Payment>(`/pembayaran?${apiQuery}`),
    params: { ...params, apiFilters: toPaymentApiFilters(params.filters) },
  });
}

export function usePaymentDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: paymentKeys.detail(publicId ?? ""),
    queryFn: () =>
      fetchOne<Payment>(`/pembayaran/${encodeURIComponent(publicId ?? "")}`),
    enabled: Boolean(publicId),
    staleTime: 0,
    select: (response) => response.data,
  });
}

// Pratinjau mengirim `dryRun=1` dan tidak pernah nilai lain: apa yang
// ditampilkannya harus sama dengan apa yang terjadi saat posting sungguhan.
export function usePostPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PostingRange & { isDryRun: boolean }) =>
      fetchOne<PostingResult>(
        input.isDryRun
          ? "/jurnal/posting-pembayaran?dryRun=1"
          : "/jurnal/posting-pembayaran",
        {
          method: "POST",
          body: JSON.stringify({ from: input.from, to: input.to }),
        },
      ),
    onSuccess: (_response, input) =>
      input.isDryRun
        ? undefined
        : Promise.all(
            [paymentKeys.all, ["journal"], ["persembahan"]].map((queryKey) =>
              queryClient.invalidateQueries({ queryKey }),
            ),
          ),
  });
}

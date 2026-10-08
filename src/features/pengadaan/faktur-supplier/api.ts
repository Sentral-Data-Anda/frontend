"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type {
  Invoice,
  InvoiceAction,
  InvoicePayload,
  PaymentPayload,
} from "./types";

export const invoiceKeys = {
  all: ["supplier-invoice"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  detail: (publicId: string) =>
    [...invoiceKeys.all, "detail", publicId] as const,
};

// Ditulis LITERAL: fitur tidak saling mengimpor, dan ini satu-satunya tempat
// jurnal disebut dari sini.
const JOURNAL_KEY = ["journal"] as const;

const BASE = "/faktur-supplier";

const pathOf = (publicId: string) => `${BASE}/${encodeURIComponent(publicId)}`;

const invalidate = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
    queryClient.invalidateQueries({ queryKey: JOURNAL_KEY }),
  ]);

export function useInvoiceList(params: ListState) {
  return useListQuery({
    queryKey: invoiceKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Invoice>(`${BASE}?${apiQuery}`),
    params,
  });
}

export function useInvoiceDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: invoiceKeys.detail(publicId ?? ""),
    queryFn: () => fetchOne<Invoice>(pathOf(publicId as string)),
    enabled: Boolean(publicId),
    staleTime: 0,
    retry: false,
    select: (response) => response.data,
  });
}

export function useSaveInvoice(publicId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: InvoicePayload) =>
      fetchOne<Invoice>(publicId ? pathOf(publicId) : BASE, {
        method: publicId ? "PUT" : "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => invalidate(queryClient),
  });
}

const ACTION_INIT: Record<InvoiceAction, { suffix: string; method: string }> = {
  terbitkan: { suffix: "/terbitkan", method: "PUT" },
  batal: { suffix: "/batal", method: "PUT" },
  hapus: { suffix: "", method: "DELETE" },
};

export function useInvoiceAction(publicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: InvoiceAction) =>
      fetchOne<unknown>(`${pathOf(publicId)}${ACTION_INIT[action].suffix}`, {
        method: ACTION_INIT[action].method,
      }),
    onSettled: () => invalidate(queryClient),
  });
}

export function useAddPayment(publicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: PaymentPayload) =>
      fetchOne<Invoice>(`${pathOf(publicId)}/pembayaran`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => invalidate(queryClient),
  });
}

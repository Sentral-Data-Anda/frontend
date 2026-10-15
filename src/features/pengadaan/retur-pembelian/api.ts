"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
  type QueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { receiptHintOf, receiptLabelOf, toReturnApiFilters } from "./model";
import type {
  PurchaseReturn,
  ReceiptForReturn,
  ReceiptOption,
  ReturnAction,
  ReturnPayload,
} from "./types";

export const returnKeys = {
  all: ["purchase-return"] as const,
  lists: () => [...returnKeys.all, "list"] as const,
  detail: (publicId: string) =>
    [...returnKeys.all, "detail", publicId] as const,
  receipts: (query: string) => [...returnKeys.all, "receipts", query] as const,
  receipt: (code: string) => [...returnKeys.all, "receipt", code] as const,
};

// Ditulis LITERAL: fitur tidak saling mengimpor, dan ini satu-satunya tempat
// ketiga daftar itu disebut dari sini. Menyelesaikan retur memindahkan stok
// dan mencabut aset, jadi keduanya basi begitu retur selesai.
const APPROVAL_KEY = ["persetujuan"] as const;
const STOCK_KEYS = [
  ["stock-item"],
  ["stock-movement"],
  ["asset"],
  ["asset-register"],
] as const;

const BASE = "/retur-pembelian";

const RECEIPT_BASE = "/penerimaan-barang";

const pathOf = (publicId: string) => `${BASE}/${encodeURIComponent(publicId)}`;

const invalidate = (queryClient: QueryClient, action?: ReturnAction) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: returnKeys.all }),
    queryClient.invalidateQueries({ queryKey: APPROVAL_KEY }),
    ...(action === "selesai"
      ? STOCK_KEYS.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        )
      : []),
  ]);

export function useReturnList(params: ListState) {
  return useListQuery({
    queryKey: returnKeys.lists(),
    fetchPage: (apiQuery) => fetchList<PurchaseReturn>(`${BASE}?${apiQuery}`),
    params: { ...params, apiFilters: toReturnApiFilters(params.filters) },
  });
}

export function useReturnDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: returnKeys.detail(publicId ?? ""),
    queryFn: () => fetchOne<PurchaseReturn>(pathOf(publicId as string)),
    enabled: Boolean(publicId),
    staleTime: 0,
    retry: false,
    select: (response) => response.data,
  });
}

/**
 * Penerimaan yang sebuah retur boleh menunjuk, dicari di server.
 *
 * Tidak lewat `useDdlSearch`: helper itu memanggil `/ddl/...` dan penerimaan
 * barang tidak punya endpoint ddl. Nilainya kode, bukan id, karena rincian
 * penerimaan dibaca lewat kode — id numeriknya baru dipakai saat menyimpan.
 */
export function useReceiptOptions(pinnedCode: string, pinnedLabel: string) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  const receipts = useQuery({
    queryKey: returnKeys.receipts(debounced),
    queryFn: () =>
      fetchList<ReceiptOption>(
        `${RECEIPT_BASE}?limit=20${debounced ? `&filter=${encodeURIComponent(debounced)}` : ""}`,
      ),
    staleTime: 5 * 60_000,
    retry: false,
    placeholderData: keepPreviousData,
    select: (response) =>
      response.data.map((row) => ({
        value: row.code,
        label: receiptLabelOf(row),
        hint: receiptHintOf(row),
      })),
  });

  const options = receipts.data ?? [];
  const isPinnedMissing =
    pinnedCode !== "" && !options.some((option) => option.value === pinnedCode);

  useEffect(() => {
    if (query === debounced) return;

    const timer = setTimeout(() => setDebounced(query), 300);

    return () => clearTimeout(timer);
  }, [query, debounced]);

  return {
    options: isPinnedMissing
      ? [{ value: pinnedCode, label: pinnedLabel }, ...options]
      : options,
    isLoading: receipts.isFetching,
    onSearch: setQuery,
  };
}

/**
 * Rincian penerimaan yang diretur: id numeriknya, kursnya, dan barisnya.
 *
 * Kursnya ikut karena nilai retur dihitung pada kurs pesanannya, bukan kurs
 * hari ini — itu yang be-sada pakai, dan dua jawaban untuk satu angka adalah
 * yang paling perlu dihindari di layar uang.
 */
export function useReceiptForReturn(code: string) {
  return useQuery({
    queryKey: returnKeys.receipt(code),
    queryFn: () =>
      fetchOne<ReceiptForReturn>(`${RECEIPT_BASE}/${encodeURIComponent(code)}`),
    enabled: code !== "",
    staleTime: 5 * 60_000,
    retry: false,
    select: (response) => response.data,
  });
}

export function useSaveReturn(publicId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ReturnPayload) =>
      fetchOne<PurchaseReturn>(publicId ? pathOf(publicId) : BASE, {
        method: publicId ? "PUT" : "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => invalidate(queryClient),
  });
}

const ACTION_INIT: Record<ReturnAction, { suffix: string; method: string }> = {
  pengajuan: { suffix: "/pengajuan", method: "POST" },
  selesai: { suffix: "/selesai", method: "PUT" },
  batal: { suffix: "/batal", method: "PUT" },
  hapus: { suffix: "", method: "DELETE" },
};

export function useReturnAction(publicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: ReturnAction) =>
      fetchOne<unknown>(`${pathOf(publicId)}${ACTION_INIT[action].suffix}`, {
        method: ACTION_INIT[action].method,
      }),
    onSettled: (_data, _error, action) => invalidate(queryClient, action),
  });
}

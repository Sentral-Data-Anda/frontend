"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";
import { MEDIA_REFETCH_MS } from "@/lib/attachment";

import { toExpenseQuery } from "./model";
import type {
  CashExpense,
  CashExpenseDetail,
  ExpenseAction,
  GateCompliance,
  WaiveInput,
} from "./types";

export const expenseKeys = {
  all: ["cash-expense"] as const,
  lists: () => [...expenseKeys.all, "list"] as const,
  detail: (publicId: string) =>
    [...expenseKeys.all, "detail", publicId] as const,
};

const BASE = "/kas-keluar";

// queryKey fitur Laporan Budget ditulis LITERAL: fitur tidak saling
// mengimpor, dan ini satu-satunya dua tempat yang menyebutnya.
const REPORT_KEY = ["budget-report"] as const;

const pathOf = (publicId?: string) =>
  publicId ? `${BASE}/${encodeURIComponent(publicId)}` : BASE;

export function useExpenseList(params: ListState) {
  const query = toExpenseQuery(params.status, params.filters);

  return useListQuery({
    queryKey: expenseKeys.lists(),
    fetchPage: (apiQuery) => fetchList<CashExpense>(`${BASE}?${apiQuery}`),
    params: { ...params, ...query },
  });
}

export function useExpenseDetail(
  publicId: string | undefined,
  isMediaRefetched = true,
) {
  return useQuery({
    queryKey: expenseKeys.detail(publicId ?? ""),
    queryFn: () => fetchOne<CashExpenseDetail>(pathOf(publicId)),
    enabled: Boolean(publicId),
    staleTime: 0,
    retry: false,
    refetchInterval: (query) =>
      isMediaRefetched && query.state.data?.data.attachments.length
        ? MEDIA_REFETCH_MS
        : false,
    select: (response) => response.data,
  });
}

// Kepatuhan M−1 komisi yang dipilih di form. Dibaca dari daftar Belum lapor
// bulan itu supaya layar dan gerbang memakai sumber yang sama.
export function useGateCompliance(
  bapelId: string,
  year: number,
  month: number,
) {
  return useQuery({
    queryKey: [...REPORT_KEY, "compliance", `${year}-${month}`],
    queryFn: () =>
      fetchList<GateCompliance>(
        `/laporan-budget/belum-lapor?year=${year}&month=${month}`,
      ),
    enabled: Boolean(bapelId),
    retry: false,
    select: (response) =>
      response.data.find((row) => String(row.bapelId) === bapelId) ?? null,
  });
}

export function useWaiveGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: WaiveInput) =>
      fetchOne<unknown>(`${BASE}/pembebasan`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    // Kas Keluar DAN Belum lapor: tab kepatuhan berubah seketika.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
        queryClient.invalidateQueries({ queryKey: REPORT_KEY }),
      ]),
  });
}

const JOURNAL_ACTIONS = new Set<ExpenseAction>(["bayar", "batal"]);

const APPROVAL_ACTIONS = new Set<ExpenseAction>(["pengajuan", "tarik"]);

function useInvalidateExpense() {
  const queryClient = useQueryClient();

  return (action: ExpenseAction | "simpan", isGone = false) =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: expenseKeys.all,
        refetchType: isGone ? "none" : "active",
      }),
      ...(APPROVAL_ACTIONS.has(action as ExpenseAction)
        ? [queryClient.invalidateQueries({ queryKey: ["persetujuan"] })]
        : []),
      ...(JOURNAL_ACTIONS.has(action as ExpenseAction)
        ? [queryClient.invalidateQueries({ queryKey: ["journal"] })]
        : []),
    ]);
}

export function useSaveExpense(publicId?: string) {
  const onInvalidate = useInvalidateExpense();

  return useMutation({
    mutationFn: (body: FormData) =>
      fetchOne<CashExpenseDetail>(pathOf(publicId), {
        method: publicId ? "PUT" : "POST",
        body,
      }),
    onSuccess: () => onInvalidate("simpan"),
  });
}

const ACTION_INIT: Record<ExpenseAction, { suffix: string; method: string }> = {
  pengajuan: { suffix: "/pengajuan", method: "POST" },
  tarik: { suffix: "/tarik", method: "PUT" },
  bayar: { suffix: "/bayar", method: "PUT" },
  batal: { suffix: "/batal", method: "PUT" },
  hapus: { suffix: "", method: "DELETE" },
};

export type ExpenseActionInput = {
  action: ExpenseAction;
  cancelReason?: string;
};

export function useExpenseAction(publicId: string) {
  const onInvalidate = useInvalidateExpense();

  return useMutation({
    mutationFn: ({ action, cancelReason }: ExpenseActionInput) =>
      fetchOne<unknown>(`${pathOf(publicId)}${ACTION_INIT[action].suffix}`, {
        method: ACTION_INIT[action].method,
        body: cancelReason ? JSON.stringify({ cancelReason }) : undefined,
      }),
    onSettled: (_data, error, input) =>
      onInvalidate(input.action, input.action === "hapus" && !error),
  });
}

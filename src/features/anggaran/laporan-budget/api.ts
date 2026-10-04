"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";
import { MEDIA_REFETCH_MS } from "@/lib/attachment";
import type { BudgetSetting } from "@/types/anggaran";

import { toReportQuery } from "./model";
import type {
  BudgetReport,
  BudgetReportDetail,
  ComplianceRow,
  Prefill,
  ReportAction,
} from "./types";

export const reportKeys = {
  all: ["budget-report"] as const,
  lists: () => [...reportKeys.all, "list"] as const,
  detail: (publicId: string) =>
    [...reportKeys.all, "detail", publicId] as const,
  compliance: (month: string) =>
    [...reportKeys.all, "compliance", month] as const,
  prefill: (bapelId: string, month: string) =>
    [...reportKeys.all, "prefill", bapelId, month] as const,
};

const BASE = "/laporan-budget";

// Laporan yang disetujui membuka pencairan bulan berikutnya, jadi perilaku
// daftar Kas Keluar berubah setiap kali laporan ini berubah.
const EXPENSE_KEY = ["cash-expense"] as const;

const APPROVAL_KEY = ["persetujuan"] as const;

const SETTING_KEY = ["budget-setting"] as const;

const APPROVAL_ACTIONS = new Set<ReportAction>(["pengajuan", "tarik"]);

const ACTION_INIT: Record<ReportAction, { suffix: string; method: string }> = {
  pengajuan: { suffix: "/pengajuan", method: "POST" },
  tarik: { suffix: "/tarik", method: "PUT" },
  hapus: { suffix: "", method: "DELETE" },
};

const pathOf = (publicId?: string) =>
  publicId ? `${BASE}/${encodeURIComponent(publicId)}` : BASE;

const monthQuery = (month: string) =>
  `year=${month.slice(0, 4)}&month=${Number(month.slice(5, 7))}`;

function useInvalidateReport() {
  const queryClient = useQueryClient();

  return (action: ReportAction | "simpan", isGone = false) =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: reportKeys.all,
        refetchType: isGone ? "none" : "active",
      }),
      queryClient.invalidateQueries({ queryKey: EXPENSE_KEY }),
      ...(APPROVAL_ACTIONS.has(action as ReportAction)
        ? [queryClient.invalidateQueries({ queryKey: APPROVAL_KEY })]
        : []),
    ]);
}

// Tahun pelayanan sebuah bulan hanya bisa dibaca dari rentang yang dikirim
// server: menurunkannya dari tahun kalender bulan laporan akan salah di gereja
// yang memulai tahun pelayanannya bukan Januari.
export function useBudgetSetting() {
  return useQuery({
    queryKey: SETTING_KEY,
    queryFn: () => fetchOne<BudgetSetting>("/setelan-anggaran"),
    select: (response) => response.data,
  });
}

export function useReportList(params: ListState) {
  const query = toReportQuery(params.filters);

  return useListQuery({
    queryKey: reportKeys.lists(),
    fetchPage: (apiQuery) => fetchList<BudgetReport>(`${BASE}?${apiQuery}`),
    params: { ...params, ...query },
  });
}

export function useReportDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: reportKeys.detail(publicId ?? ""),
    queryFn: () => fetchOne<BudgetReportDetail>(pathOf(publicId)),
    enabled: Boolean(publicId),
    staleTime: 0,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.data.listReceipt.length ? MEDIA_REFETCH_MS : false,
    select: (response) => response.data,
  });
}

export function useCompliance(month: string, isEnabled = true) {
  return useQuery({
    queryKey: reportKeys.compliance(month),
    queryFn: () =>
      fetchList<ComplianceRow>(`${BASE}/belum-lapor?${monthQuery(month)}`),
    enabled: isEnabled && Boolean(month),
    select: (response) => response.data,
  });
}

export function usePrefill(bapelId: string, month: string, isEnabled: boolean) {
  return useQuery({
    queryKey: reportKeys.prefill(bapelId, month),
    queryFn: () =>
      fetchOne<Prefill>(
        `${BASE}/prefill?bapelId=${bapelId}&${monthQuery(month)}`,
      ),
    enabled: isEnabled && Boolean(bapelId) && Boolean(month),
    staleTime: 0,
    retry: false,
    select: (response) => response.data,
  });
}

export function useSaveReport(publicId?: string) {
  const onInvalidate = useInvalidateReport();

  return useMutation({
    mutationFn: (body: FormData) =>
      fetchOne<BudgetReportDetail>(pathOf(publicId), {
        method: publicId ? "PUT" : "POST",
        body,
      }),
    onSuccess: () => onInvalidate("simpan"),
  });
}

export function useReportAction(publicId: string) {
  const onInvalidate = useInvalidateReport();

  return useMutation({
    mutationFn: (action: ReportAction) =>
      fetchOne<unknown>(`${pathOf(publicId)}${ACTION_INIT[action].suffix}`, {
        method: ACTION_INIT[action].method,
      }),
    onSettled: (_data, error, action) =>
      onInvalidate(action, action === "hapus" && !error),
  });
}

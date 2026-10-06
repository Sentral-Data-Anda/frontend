"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type {
  PayrollAction,
  PayrollPaid,
  PayrollPayload,
  PayrollRun,
  PayrollRunDetail,
} from "./types";

const BASE = "/payroll";

const pathOf = (code: string) => `${BASE}/${encodeURIComponent(code)}`;

const METHOD: Record<PayrollAction, "PUT" | "POST"> = {
  hitung: "PUT",
  pengajuan: "POST",
  bayar: "PUT",
  batal: "PUT",
};

export const payrollKeys = {
  all: ["payroll"] as const,
  lists: () => [...payrollKeys.all, "list"] as const,
  detail: (code: string) => [...payrollKeys.all, "detail", code] as const,
};

export function usePayrollList(params: ListState) {
  return useListQuery({
    queryKey: payrollKeys.lists(),
    fetchPage: (apiQuery) => fetchList<PayrollRun>(`${BASE}?${apiQuery}`),
    params,
  });
}

export function usePayrollDetail(code: string | undefined) {
  return useQuery({
    queryKey: payrollKeys.detail(code ?? ""),
    queryFn: () => fetchOne<PayrollRunDetail>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidatePayroll(code?: string) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() }),
      queryClient.invalidateQueries({
        queryKey: payrollKeys.detail(code ?? ""),
      }),
    ]);
}

export function useOpenPayroll() {
  const onInvalidate = useInvalidatePayroll();

  return useMutation({
    mutationFn: (payload: PayrollPayload) =>
      fetchOne<PayrollRun>(BASE, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function usePayrollAction(code: string) {
  const onInvalidate = useInvalidatePayroll(code);

  return useMutation({
    mutationFn: (action: PayrollAction) =>
      fetchOne<PayrollPaid>(`${pathOf(code)}/${action}`, {
        method: METHOD[action],
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeletePayroll(code: string) {
  const onInvalidate = useInvalidatePayroll(code);

  return useMutation({
    mutationFn: () => fetchOne<PayrollRun>(pathOf(code), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import type { ListFilterSchema, ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { Loan, LoanDetail, LoanPayload, LoanStatus } from "./types";

export const loanKeys = {
  all: ["loan"] as const,
  lists: () => [...loanKeys.all, "list"] as const,
  detail: (publicId: string) => [...loanKeys.all, "detail", publicId] as const,
};

const BASE = "/pinjaman";

const pathOf = (publicId: string) => `${BASE}/${encodeURIComponent(publicId)}`;

export const LOAN_FILTERS = {
  arah: { api: "direction" },
} satisfies ListFilterSchema;

const invalidate = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: loanKeys.all });

export function useLoanList(params: ListState) {
  return useListQuery({
    queryKey: loanKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Loan>(`${BASE}?${apiQuery}`),
    params,
  });
}

export function useLoanDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: loanKeys.detail(publicId ?? ""),
    queryFn: () => fetchOne<LoanDetail>(pathOf(publicId as string)),
    enabled: Boolean(publicId),
    staleTime: 0,
    retry: false,
    select: (response) => response.data,
  });
}

export function useSaveLoan(publicId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: LoanPayload) =>
      fetchOne<Loan>(publicId ? pathOf(publicId) : BASE, {
        method: publicId ? "PUT" : "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useSetLoanStatus(publicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: LoanStatus) =>
      fetchOne<Loan>(`${pathOf(publicId)}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    onSettled: () => invalidate(queryClient),
  });
}

export function useDeleteLoan(publicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fetchOne<unknown>(pathOf(publicId), { method: "DELETE" }),
    onSettled: () => invalidate(queryClient),
  });
}

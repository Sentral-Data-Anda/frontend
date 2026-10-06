"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type {
  KomponenPayroll,
  KomponenPayrollPayload,
  PenetapanKomponen,
  PenetapanPayload,
} from "./types";

const BASE = "/komponen-payroll";

const ASSIGNMENT_BASE = `${BASE}/karyawan`;

const pathOf = (code: string) => `${BASE}/${encodeURIComponent(code)}`;

const assignmentPathOf = (publicId: string) =>
  `${ASSIGNMENT_BASE}/${encodeURIComponent(publicId)}`;

export const komponenPayrollKeys = {
  all: ["komponen-payroll"] as const,
  lists: () => [...komponenPayrollKeys.all, "list"] as const,
  detail: (code: string) =>
    [...komponenPayrollKeys.all, "detail", code] as const,
  assignments: () => [...komponenPayrollKeys.all, "penetapan", "list"] as const,
  assignment: (publicId: string) =>
    [...komponenPayrollKeys.all, "penetapan", "detail", publicId] as const,
};

export function useKomponenPayrollList(params: ListState) {
  return useListQuery({
    queryKey: komponenPayrollKeys.lists(),
    fetchPage: (apiQuery) => fetchList<KomponenPayroll>(`${BASE}?${apiQuery}`),
    params,
  });
}

export function useKomponenPayrollDetail(code: string | undefined) {
  return useQuery({
    queryKey: komponenPayrollKeys.detail(code ?? ""),
    queryFn: () => fetchOne<KomponenPayroll>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidateKomponen(code?: string) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: komponenPayrollKeys.lists() }),
      queryClient.invalidateQueries({
        queryKey: komponenPayrollKeys.detail(code ?? ""),
        refetchType: "none",
      }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.all,
        predicate: (query) =>
          String(query.queryKey[1]).startsWith("komponen-payroll"),
      }),
    ]);
}

export function useSaveKomponenPayroll(code?: string) {
  const onInvalidate = useInvalidateKomponen(code);

  return useMutation({
    mutationFn: (payload: KomponenPayrollPayload) =>
      fetchOne<KomponenPayroll>(code ? pathOf(code) : BASE, {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteKomponenPayroll(code: string | undefined) {
  const onInvalidate = useInvalidateKomponen(code);

  return useMutation({
    mutationFn: () =>
      fetchOne<KomponenPayroll>(pathOf(code ?? ""), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

export function usePenetapanList(params: ListState) {
  return useListQuery({
    queryKey: komponenPayrollKeys.assignments(),
    fetchPage: (apiQuery) =>
      fetchList<PenetapanKomponen>(`${ASSIGNMENT_BASE}?${apiQuery}`),
    params,
  });
}

export function usePenetapanDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: komponenPayrollKeys.assignment(publicId ?? ""),
    queryFn: () =>
      fetchOne<PenetapanKomponen>(assignmentPathOf(publicId ?? "")),
    enabled: Boolean(publicId),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidatePenetapan(publicId?: string) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: komponenPayrollKeys.assignments(),
      }),
      queryClient.invalidateQueries({
        queryKey: komponenPayrollKeys.assignment(publicId ?? ""),
        refetchType: "none",
      }),
    ]);
}

export function useSavePenetapan(publicId?: string) {
  const onInvalidate = useInvalidatePenetapan(publicId);

  return useMutation({
    mutationFn: (payload: PenetapanPayload) =>
      fetchOne<PenetapanKomponen>(
        publicId ? assignmentPathOf(publicId) : ASSIGNMENT_BASE,
        {
          method: publicId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: onInvalidate,
  });
}

export function useDeletePenetapan(publicId: string | undefined) {
  const onInvalidate = useInvalidatePenetapan(publicId);

  return useMutation({
    mutationFn: () =>
      fetchOne<PenetapanKomponen>(assignmentPathOf(publicId ?? ""), {
        method: "DELETE",
      }),
    onSuccess: onInvalidate,
  });
}

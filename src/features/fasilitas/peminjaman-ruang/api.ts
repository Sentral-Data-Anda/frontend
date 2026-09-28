"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { toLoanApiFilters } from "./model";
import type {
  CheckBody,
  CheckResult,
  LoanPayload,
  LoanRoom,
  LoanRoomDetail,
  LoanSaved,
  RoomBooking,
} from "./types";

export const loanRoomKeys = {
  all: ["loan-room"] as const,
  lists: () => [...loanRoomKeys.all, "list"] as const,
  detail: (code: string) => [...loanRoomKeys.all, "detail", code] as const,
  booking: (roomId: string, date: string) =>
    [...loanRoomKeys.all, "booking", roomId, date] as const,
  checks: () => [...loanRoomKeys.all, "check"] as const,
};

const pathOf = (code: string) => `/loan-room/${encodeURIComponent(code)}`;

export function useLoanRoomList(params: ListState) {
  return useListQuery({
    queryKey: loanRoomKeys.lists(),
    fetchPage: (apiQuery) => fetchList<LoanRoom>(`/loan-room?${apiQuery}`),
    params: { ...params, apiFilters: toLoanApiFilters(params.filters) },
  });
}

export function useLoanRoomDetail(code: string | undefined) {
  return useQuery({
    queryKey: loanRoomKeys.detail(code ?? ""),
    queryFn: () => fetchOne<LoanRoomDetail>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useRoomBooking(roomId: string, date: string) {
  return useQuery({
    queryKey: loanRoomKeys.booking(roomId, date),
    queryFn: () =>
      fetchList<RoomBooking>(
        `/loan-room/booking?roomId=${encodeURIComponent(roomId)}&date=${encodeURIComponent(date)}`,
      ),
    enabled: Boolean(roomId && date),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useClashCheck(body: CheckBody, isEnabled: boolean) {
  return useQuery({
    queryKey: [
      ...loanRoomKeys.checks(),
      body.roomId,
      body.startTime,
      body.endTime,
      body.dates,
    ],
    queryFn: () =>
      fetchOne<CheckResult[]>("/loan-room/check", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    enabled: isEnabled,
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidateLoans() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: loanRoomKeys.all,
        refetchType: "none",
      }),
      queryClient.invalidateQueries({
        queryKey: ["room", "usage"],
        refetchType: "none",
      }),
    ]);
}

export function useRefreshSlots() {
  const queryClient = useQueryClient();

  return (roomId: string, date: string) =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: loanRoomKeys.booking(roomId, date),
      }),
      queryClient.invalidateQueries({ queryKey: loanRoomKeys.checks() }),
    ]);
}

export function useSaveLoanRoom(code?: string) {
  const onInvalidate = useInvalidateLoans();

  return useMutation({
    mutationFn: (payload: LoanPayload) =>
      fetchOne<LoanSaved>(code ? pathOf(code) : "/loan-room", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useSaveLoanBatch() {
  const onInvalidate = useInvalidateLoans();

  return useMutation({
    mutationFn: (rows: LoanPayload[]) =>
      fetchOne<{ codes: string[] }>("/loan-room/batch", {
        method: "POST",
        body: JSON.stringify({ rows }),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteLoanRoom(code: string | undefined) {
  const onInvalidate = useInvalidateLoans();

  return useMutation({
    mutationFn: () =>
      fetchOne<LoanSaved>(pathOf(code ?? ""), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

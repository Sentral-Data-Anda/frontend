"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys, useDdlSearch } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { FetchError, fetchList, fetchOne } from "@/lib/api/fetcher";

import type {
  EventOption,
  Registration,
  RegistrationDetail,
  RegistrationPayload,
} from "./types";

export const pendaftaranKeys = {
  all: ["pendaftaran-event"] as const,
  lists: () => [...pendaftaranKeys.all, "list"] as const,
  detail: (code: string) => [...pendaftaranKeys.all, "detail", code] as const,
};

export const EVENT_DDL_PATH = "event";

export const OPEN_EVENT_DDL_PATH = "event?isOpen=1";

const EVENT_LIST_KEY = ["event", "list"] as const;

const pathOf = (code: string) =>
  `/pendaftaran-event/${encodeURIComponent(code)}`;

export function usePendaftaranList(params: ListState) {
  return useListQuery({
    queryKey: pendaftaranKeys.lists(),
    fetchPage: (apiQuery) =>
      fetchList<Registration>(`/pendaftaran-event?${apiQuery}`),
    params,
  });
}

export function usePendaftaranDetail(code: string | undefined) {
  return useQuery({
    queryKey: pendaftaranKeys.detail(code ?? ""),
    queryFn: () => fetchOne<RegistrationDetail>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useEventOptions(path: string) {
  return useQuery({
    queryKey: ddlKeys.list(path),
    queryFn: () => fetchList<EventOption>(`/ddl/${path}`),
    staleTime: 60_000,
    select: (response) => response.data,
  });
}

export const useJemaatSearch = () => useDdlSearch("jemaat", "id");

function useInvalidatePendaftaran() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: pendaftaranKeys.all }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.list(EVENT_DDL_PATH),
      }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.list(OPEN_EVENT_DDL_PATH),
      }),
      queryClient.invalidateQueries({ queryKey: EVENT_LIST_KEY }),
    ]);
}

export function useCreatePendaftaran() {
  const onInvalidate = useInvalidatePendaftaran();

  return useMutation({
    mutationFn: (payload: RegistrationPayload) =>
      fetchOne<RegistrationDetail>("/pendaftaran-event", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useCancelPendaftaran(code: string) {
  const onInvalidate = useInvalidatePendaftaran();

  return useMutation({
    mutationFn: () =>
      fetchOne<RegistrationDetail>(pathOf(code), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}

export function useReissueInvoice(code: string) {
  const queryClient = useQueryClient();
  const onInvalidate = useInvalidatePendaftaran();

  return useMutation({
    mutationFn: () =>
      fetchOne<RegistrationDetail>(`${pathOf(code)}/invoice`, {
        method: "POST",
      }),
    // Jawaban bisa CONFIRMED/PAID bila tagihan lama terbayar bersamaan.
    onSuccess: (response) => {
      queryClient.setQueryData(pendaftaranKeys.detail(code), response);
      return onInvalidate();
    },
    onError: (error) => {
      if (error instanceof FetchError && error.status === 409) {
        return queryClient.invalidateQueries({
          queryKey: pendaftaranKeys.detail(code),
        });
      }
    },
  });
}

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

import { toJournalApiFilters } from "./model";
import type {
  JournalEntry,
  JournalEntryDetail,
  JournalPayload,
  PostingRange,
  PostingResult,
  ReversePayload,
} from "./types";

export const journalKeys = {
  all: ["journal"] as const,
  lists: () => [...journalKeys.all, "list"] as const,
  detail: (publicId: string) =>
    [...journalKeys.all, "detail", publicId] as const,
};

const PERIOD_KEY = ["fiscal-period"] as const;

const PERSEMBAHAN_KEY = ["persembahan"] as const;

export const JOURNAL_FILTERS = {
  bulan: { api: "bulan" },
  akun: { api: "akun" },
} satisfies ListFilterSchema;

const pathOf = (publicId: string) => `/jurnal/${encodeURIComponent(publicId)}`;

const invalidateJournal = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: journalKeys.all }),
    queryClient.invalidateQueries({ queryKey: PERIOD_KEY }),
  ]);

export function useJournalList(params: ListState) {
  return useListQuery({
    queryKey: journalKeys.lists(),
    fetchPage: (apiQuery) => fetchList<JournalEntry>(`/jurnal?${apiQuery}`),
    params: { ...params, apiFilters: toJournalApiFilters(params.filters) },
  });
}

export function useJournalDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: journalKeys.detail(publicId ?? ""),
    queryFn: () => fetchOne<JournalEntryDetail>(pathOf(publicId ?? "")),
    enabled: Boolean(publicId),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useSaveJournal(publicId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: JournalPayload) =>
      fetchOne<JournalEntryDetail>(publicId ? pathOf(publicId) : "/jurnal", {
        method: publicId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => invalidateJournal(queryClient),
  });
}

export function usePostJournal(publicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchOne<JournalEntryDetail>(`${pathOf(publicId)}/post`, {
        method: "POST",
      }),
    onSuccess: () => invalidateJournal(queryClient),
  });
}

export function useReverseJournal(publicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReversePayload) =>
      fetchOne<JournalEntryDetail>(`${pathOf(publicId)}/reverse`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => invalidateJournal(queryClient),
  });
}

export function useDeleteJournal(publicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fetchOne<unknown>(pathOf(publicId), { method: "DELETE" }),
    onSuccess: () => invalidateJournal(queryClient),
  });
}

// Pratinjau mengirim `dryRun=1` dan tidak pernah nilai lain: apa yang
// ditampilkannya harus sama dengan apa yang terjadi saat posting sungguhan.
export function usePostPersembahan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PostingRange & { isDryRun: boolean }) =>
      fetchOne<PostingResult>(
        input.isDryRun
          ? "/jurnal/posting-persembahan?dryRun=1"
          : "/jurnal/posting-persembahan",
        {
          method: "POST",
          body: JSON.stringify({ from: input.from, to: input.to }),
        },
      ),
    onSuccess: (_response, input) =>
      input.isDryRun
        ? undefined
        : Promise.all([
            invalidateJournal(queryClient),
            queryClient.invalidateQueries({ queryKey: PERSEMBAHAN_KEY }),
          ]),
  });
}

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
// Cermin `assetKeys.all` fitur Inventaris, ditulis LITERAL dengan alasan yang
// sama seperti PERSEMBAHAN_KEY di atas: fitur tidak saling mengimpor.
const ASET_KEY = ["asset"] as const;

// Cermin `invoiceKeys.all` fitur Pengadaan, ditulis LITERAL.
const FAKTUR_KEY = ["supplier-invoice"] as const;

// Dua kunci, bukan satu: memposting mutasi tidak mengubah kartu stoknya, tapi
// Mutasi Stok menunjukkan nilai per baris dan Barang Persediaan menunjukkan
// harga rata-ratanya -- dan kedua layar itu membaca kunci yang berbeda.
const MUTASI_KEY = ["stock-movement"] as const;
const STOCK_ITEM_KEY = ["stock-item"] as const;

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

/**
 * Aset sumbangan dan hibah. Aset yang DIBELI tidak lewat sini: dia masuk buku
 * bersama fakturnya.
 *
 * Membatalkan daftar aset juga, bukan hanya jurnal: layar aset menunjukkan
 * apakah sebuah aset sudah dibukukan.
 */
/**
 * Faktur supplier dan pembayarannya, SATU batch dan dalam urutan itu.
 *
 * Membatalkan daftar faktur juga, bukan hanya jurnal: layar faktur menolak
 * batal dan hapus begitu fakturnya dibukukan.
 */
export function usePostPengadaan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PostingRange & { isDryRun: boolean }) =>
      fetchOne<PostingResult>(
        input.isDryRun
          ? "/jurnal/posting-pengadaan?dryRun=1"
          : "/jurnal/posting-pengadaan",
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
            queryClient.invalidateQueries({ queryKey: FAKTUR_KEY }),
          ]),
  });
}

/**
 * Mutasi persediaan: pemakaian, pembuangan, sumbangan barang, koreksi opname.
 *
 * Penerimaan barang dan beli langsung TIDAK lewat sini: uangnya sudah dibawa
 * faktur suppliernya atau Kas Keluar, dan membukukannya dua kali membuat
 * gereja membayar satu rim kertas dua kali.
 */
export function usePostPersediaan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PostingRange & { isDryRun: boolean }) =>
      fetchOne<PostingResult>(
        input.isDryRun
          ? "/jurnal/posting-persediaan?dryRun=1"
          : "/jurnal/posting-persediaan",
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
            queryClient.invalidateQueries({ queryKey: MUTASI_KEY }),
            queryClient.invalidateQueries({ queryKey: STOCK_ITEM_KEY }),
          ]),
  });
}

export function usePostAset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PostingRange & { isDryRun: boolean }) =>
      fetchOne<PostingResult>(
        input.isDryRun
          ? "/jurnal/posting-aset?dryRun=1"
          : "/jurnal/posting-aset",
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
            queryClient.invalidateQueries({ queryKey: ASET_KEY }),
          ]),
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

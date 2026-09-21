"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchList } from "@/lib/api/fetcher";

/**
 * Satu baris `GET /api/v1/ibadah`, hanya field yang dipakai Beranda.
 *
 * Diverifikasi dari `be-sada/src/modules/ibadah/ibadah.repository.ts`: baris
 * `ibadah` apa adanya (tanpa kolom audit — global omit) plus relasi
 * `typeIbadah`, `room`, `bapel`, `jadwalPelayan` berbentuk `{ id, code, name }`.
 * `startTime` adalah jam dinding "HH:mm", bukan instant.
 */
export type IbadahListItem = {
  code: string;
  startTime: string;
  preacher: string | null;
  typeIbadah: { id: number; code: string; name: string };
};

/**
 * be-sada mengurutkan `date desc, startTime desc` (daftar dibaca untuk mencari
 * yang terbaru). Jadwal satu hari dibaca dari pagi ke malam. "HH:mm" yang
 * di-pad nol terurut benar secara leksikografis.
 */
export const sortByStartTime = (items: IbadahListItem[]): IbadahListItem[] =>
  [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));

export const ibadahKeys = {
  all: ["ibadah"] as const,
  list: (query: string) => [...ibadahKeys.all, "list", query] as const,
};

/**
 * Ibadah pada satu tanggal. `limit=100` (batas be-sada): bawaan 10 dan urutan
 * menurun berarti hari dengan >10 ibadah kehilangan yang paling pagi.
 *
 * `isEnabled` false untuk peran tanpa IBADAH VIEW — tanpa itu be-sada
 * menjawab 403 dan Beranda menampilkan galat untuk bagian yang tidak dirender.
 */
export function useIbadahByDate(date: string, isEnabled: boolean) {
  const query = `date=${date}&limit=100`;

  return useQuery({
    queryKey: ibadahKeys.list(query),
    queryFn: () => fetchList<IbadahListItem>(`/ibadah?${query}`),
    select: (response) => sortByStartTime(response.data),
    enabled: isEnabled,
  });
}

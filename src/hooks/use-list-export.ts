"use client";

import { useEffect, useState } from "react";

import { useBoolean } from "@/hooks/use-boolean";
import { toApiQuery, type ListState } from "@/hooks/use-list-params";
import { csvFileName, onDownloadCsv, toCsv, type CsvColumn } from "@/lib/csv";
import type { ApiListResponse } from "@/types/api";

/**
 * Batas halaman yang diterima backend (`MAX_PAGE_SIZE`). Nilai di atasnya
 * dipangkas diam-diam, bukan ditolak, jadi meminta lebih tidak menambah baris.
 */
const PAGE_SIZE = 100;

/** Penjaga agar backend yang salah melaporkan `totalPage` tidak memutar selamanya. */
const MAX_PAGES = 200;

/**
 * Mengeluarkan daftar yang sedang tersaring, sebagai cetakan atau sebagai CSV.
 *
 * Daftar di layar berhalaman, dan mengeluarkan halaman yang sedang terlihat
 * saja akan memberi majelis sebagian mutasi tanpa menyatakan bahwa itu
 * sebagian — justru kesalahan yang paling mahal pada rekonsiliasi dengan
 * rekening koran. Jadi setiap halaman diambil lebih dulu.
 */
export function useListExport<T>({
  fetchPage,
  params,
}: {
  fetchPage: (apiQuery: string) => Promise<ApiListResponse<T>>;
  params: ListState;
}) {
  const [rows, setRows] = useState<readonly T[] | null>(null);
  const isPending = useBoolean();
  const [error, setError] = useState<Error | null>(null);

  // Dialog cetak dibuka sesudah barisnya benar-benar ada di DOM, bukan di dalam
  // penangan kliknya. Isinya tersembunyi di layar dan hanya muncul saat cetak,
  // jadi membersihkannya kembali tidak terlihat oleh pengguna.
  useEffect(() => {
    if (!rows) return;

    // Dibersihkan lewat `afterprint`, bukan tepat sesudah `print()`: di sebagian
    // browser dialognya tidak memblokir, dan membuang barisnya terlalu cepat
    // mencetak lembar kosong.
    const onAfterPrint = () => setRows(null);

    window.addEventListener("afterprint", onAfterPrint, { once: true });
    window.print();

    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, [rows]);

  /** Seluruh baris yang cocok dengan filter aktif, atau null bila gagal. */
  const onCollect = async (): Promise<readonly T[] | null> => {
    isPending.onTrue();
    setError(null);

    try {
      const collected: T[] = [];
      let page = 1;
      let totalPage = 1;

      while (page <= totalPage && page <= MAX_PAGES) {
        const response = await fetchPage(
          toApiQuery({ ...params, page, limit: PAGE_SIZE }),
        );

        collected.push(...response.data);
        totalPage = response.totalPage;
        page += 1;
      }

      return collected;
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error(String(cause)));

      return null;
    } finally {
      isPending.onFalse();
    }
  };

  const onPrint = async () => {
    const collected = await onCollect();

    if (collected) setRows(collected);
  };

  const onExportCsv = async (
    columns: readonly CsvColumn<T>[],
    nameParts: readonly string[],
  ) => {
    const collected = await onCollect();

    if (collected) {
      onDownloadCsv(csvFileName(nameParts), toCsv(columns, collected));
    }
  };

  return { rows, isPending: isPending.value, error, onPrint, onExportCsv };
}

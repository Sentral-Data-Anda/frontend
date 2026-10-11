"use client";

import { useEffect, useState } from "react";

import { useBoolean } from "@/hooks/use-boolean";
import { toApiQuery, type ListState } from "@/hooks/use-list-params";
import type { ApiListResponse } from "@/types/api";

/**
 * Batas halaman yang diterima backend (`MAX_PAGE_SIZE`). Nilai di atasnya
 * dipangkas diam-diam, bukan ditolak, jadi meminta lebih tidak menambah baris.
 */
const PAGE_SIZE = 100;

/** Penjaga agar backend yang salah melaporkan `totalPage` tidak memutar selamanya. */
const MAX_PAGES = 200;

/**
 * Mengumpulkan seluruh baris yang cocok dengan filter aktif, lalu mencetak.
 *
 * Daftar di layar berhalaman, dan mencetak halaman yang sedang terlihat saja
 * akan memberi majelis sebagian mutasi tanpa menyatakan bahwa itu sebagian —
 * justru kesalahan yang paling mahal pada rekonsiliasi dengan rekening koran.
 * Jadi setiap halaman diambil lebih dulu, baru dicetak.
 */
export function usePrintList<T>({
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

  const onPrint = async () => {
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

      setRows(collected);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error(String(cause)));
    } finally {
      isPending.onFalse();
    }
  };

  return { rows, isPending: isPending.value, error, onPrint };
}

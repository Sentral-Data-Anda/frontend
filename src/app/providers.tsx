"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { shouldRetryQuery } from "@/lib/api/retry";

/**
 * `QueryClient` dibuat di dalam state, bukan di module scope.
 *
 * Module scope di App Router dibagi antar-request di server, jadi satu client
 * global berarti cache satu user bisa tersaji ke user lain — kelas bug yang
 * sama dengan yang dijaga `apiClient`. `useState` dengan initializer membuat
 * satu client per sesi browser, dan tidak pernah dibuat ulang saat re-render.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cukup untuk menahan refetch saat berpindah tab bolak-balik,
            // cukup pendek supaya data jemaat tidak terasa basi.
            staleTime: 30_000,

            // Satu aturan untuk seluruh aplikasi, bukan per query: jawaban
            // galat dari server (4xx DAN 5xx) tidak diulang, galat jaringan
            // diulang. Alasannya di `lib/api/retry.ts`.
            retry: shouldRetryQuery,

            // Aplikasi ini dipakai berjam-jam dengan layar terbuka. Refetch
            // tiap kali jendela difokuskan berarti puluhan permintaan yang
            // tidak diminta siapa pun.
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

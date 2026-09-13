"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { FetchError } from "@/lib/api/fetcher";

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

            // 4xx berarti permintaannya sendiri yang salah — mengulanginya
            // tiga kali hanya menunda pesan galat sampai ke user. 401 apalagi:
            // yang menyelesaikannya penyegaran token di proxy.ts, bukan retry.
            retry: (failureCount, error) =>
              error instanceof FetchError && error.status < 500
                ? false
                : failureCount < 2,

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

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { ToastHost } from "@/components/common/feedback/toast";
import { shouldRetryQuery } from "@/lib/api/retry";

export function Providers({ children }: { children: React.ReactNode }) {
  // Di state, bukan module scope: module scope dibagi antar-request di server.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,

            retry: shouldRetryQuery,

            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastHost>{children}</ToastHost>
    </QueryClientProvider>
  );
}

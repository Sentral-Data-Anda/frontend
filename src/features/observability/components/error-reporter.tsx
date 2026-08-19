"use client";

import { useEffect } from "react";

import { sendReport, toReport } from "@/features/observability/lib/report";

/**
 * Penangkap error global di browser. Dipasang sekali di root layout.
 *
 * Menangkap tiga hal sekaligus:
 *
 * 1. Exception yang tidak tertangkap — event `error` di window
 * 2. Promise yang ditolak tanpa penangan — event `unhandledrejection`,
 *    penyebab paling umum kegagalan senyap pada kode async
 * 3. Error yang dilaporkan `src/app/error.tsx` lewat `reportError()`.
 *    Primitif platform itu memicu event `error` global, jadi tertangkap di
 *    sini juga — termasuk `digest`-nya, yang menjadi penghubung ke baris log
 *    server dari `src/instrumentation.ts`.
 *
 * Tidak merender apa pun.
 */
export function ErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      sendReport(
        toReport("error", event.error ?? event.message, location.pathname),
      );
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      sendReport(
        toReport("unhandledrejection", event.reason, location.pathname),
      );
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}

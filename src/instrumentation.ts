import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";

import { log } from "@/lib/observability/logger";
import {
  redactError,
  redactHeaders,
  redactPath,
} from "@/lib/observability/redact";

// Sentry server/edge diinisialisasi di sini (Next 15+ instrumentation hook).
// Kalau SENTRY_DSN kosong, Sentry.init tidak mengaktifkan apa pun.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  Sentry.captureRequestError(error, request, context);

  log.error("server_error", {
    ...redactError(error),
    request: {
      method: request.method,
      path: redactPath(request.path),
      headers: redactHeaders(request.headers),
    },
    context: {
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
      revalidateReason: context.revalidateReason,
    },
  });
};

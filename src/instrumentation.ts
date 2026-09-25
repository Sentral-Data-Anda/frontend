import type { Instrumentation } from "next";

import { log } from "@/lib/observability/logger";
import {
  redactError,
  redactHeaders,
  redactPath,
} from "@/lib/observability/redact";

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
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

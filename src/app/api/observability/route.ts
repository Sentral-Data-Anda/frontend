import { z } from "zod";

import { log } from "@/lib/observability/logger";
import {
  MAX_MESSAGE_LENGTH,
  redactPath,
  truncate,
} from "@/lib/observability/redact";

const MAX_BODY_BYTES = 4_000;

const reportSchema = z.object({
  kind: z.enum(["error", "unhandledrejection"]),
  name: z.string().max(100),
  message: z.string().max(MAX_MESSAGE_LENGTH * 2),
  digest: z.string().max(100).optional(),
  path: z.string().max(500).optional(),
});

const WINDOW_MS = 60_000;
const MAX_REPORTS_PER_WINDOW = 60;

let windowStartedAt = 0;
let reportsInWindow = 0;

function withinRateLimit(): boolean {
  const now = Date.now();

  if (now - windowStartedAt > WINDOW_MS) {
    windowStartedAt = now;
    reportsInWindow = 0;
  }

  reportsInWindow += 1;
  return reportsInWindow <= MAX_REPORTS_PER_WINDOW;
}

export async function POST(request: Request): Promise<Response> {
  if (!withinRateLimit()) {
    return new Response(null, { status: 429 });
  }

  const body = await request.text();

  if (body.length > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }

  let parsed;
  try {
    parsed = reportSchema.safeParse(JSON.parse(body));
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!parsed.success) {
    return new Response(null, { status: 400 });
  }

  const report = parsed.data;

  log.error("client_error", {
    kind: report.kind,
    name: report.name,
    message: truncate(report.message),
    ...(report.digest ? { digest: report.digest } : {}),
    ...(report.path ? { path: redactPath(report.path) } : {}),
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  return new Response(null, { status: 204 });
}

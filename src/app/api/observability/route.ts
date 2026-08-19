import { z } from "zod";

import { log } from "@/lib/observability/logger";
import {
  MAX_MESSAGE_LENGTH,
  redactPath,
  truncate,
} from "@/lib/observability/redact";

/**
 * Penampung laporan error dari browser.
 *
 * Error yang terjadi di client tidak pernah sampai ke log server dengan
 * sendirinya. Rute ini jembatannya: pelapor di browser
 * (src/features/observability) mengirim ke sini, lalu dicatat dengan bentuk
 * yang sama seperti error server sehingga keduanya bisa dicari bersama.
 *
 * Rute ini SENGAJA berada di bawah `/api/`, karena dua tempat sudah
 * memperlakukan prefix itu secara khusus: service worker tidak pernah
 * menyentuhnya, dan `config.matcher` di src/proxy.ts mengecualikannya.
 *
 * === BATAS YANG DISADARI ===
 * Endpoint ini terbuka — siapa pun yang bisa membuka aplikasi bisa
 * mengirimkannya. Pembatas di bawah menahan banjir log dari klien yang
 * terjebak loop error, BUKAN penyerang yang sengaja membanjiri: hitungannya
 * per-instance dan hilang saat restart. Pembatasan yang sebenarnya harus
 * dipasang di lapisan infrastruktur (WAF atau rate limit di reverse proxy).
 */

const MAX_BODY_BYTES = 4_000;

const reportSchema = z.object({
  kind: z.enum(["error", "unhandledrejection"]),
  name: z.string().max(100),
  message: z.string().max(MAX_MESSAGE_LENGTH * 2),
  digest: z.string().max(100).optional(),
  path: z.string().max(500).optional(),
});

/** Jendela dan kuota pembatas sederhana per-instance. */
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
    // 429 tanpa badan. Pelapor di browser tidak mencoba ulang.
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

  // 204: tidak ada yang perlu dikembalikan, dan pelapor tidak menunggu apa pun.
  return new Response(null, { status: 204 });
}

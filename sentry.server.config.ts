import * as Sentry from "@sentry/nextjs";

// DSN server dibaca saat RUNTIME (bukan NEXT_PUBLIC_), jadi tidak dibekukan di
// bundle. Kalau kosong, SDK non-aktif total: tidak ada inisialisasi jaringan dan
// tidak ada event terkirim. Dengan begitu staging bisa jalan tanpa akun Sentry.
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.SENTRY_ENVIRONMENT ?? "staging",
  release: process.env.SENTRY_RELEASE,
  // STAGING: 100% supaya trace & metrics server langsung terlihat.
  // Turunkan (mis. 0.1) untuk production.
  tracesSampleRate: 1.0,
  // log.warn/log.error aplikasi (console wrapper) ikut ke Sentry Logs.
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],
});

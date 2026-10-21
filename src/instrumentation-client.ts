import * as Sentry from "@sentry/nextjs";

import { installErrorListeners } from "@/features/observability";

// DSN browser di-inline saat BUILD (NEXT_PUBLIC_*), lihat ARG di Dockerfile.
// Kosong -> Sentry non-aktif, aplikasi tetap jalan normal.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "staging",
  release: process.env.NEXT_PUBLIC_BUILD_ID,
  // STAGING: 100% supaya data trace/profile langsung kelihatan saat dicek.
  // Turunkan (mis. 0.1) untuk production supaya kuota tidak jebol.
  tracesSampleRate: 1.0,
  // Profiling browser: sesi diprofilkan mengikuti trace yang ter-sampling.
  profileSessionSampleRate: 1.0,
  profileLifecycle: "trace",
  // STAGING: rekam semua sesi. Turunkan replaysSessionSampleRate (mis. 0.1) di
  // production; sesi yang mengalami error tetap direkam penuh lewat OnError.
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.browserProfilingIntegration(),
    // Data jemaat itu pribadi: teks, input, dan media tetap di-mask/blok.
    // Body request/response sengaja tidak direkam (login membawa password).
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
      networkDetailAllowUrls: [`${window.location.origin}/api`],
      networkDetailDenyUrls: [`${window.location.origin}/api/v1/auth`],
      networkCaptureBodies: false,
    }),
    // Teruskan console.warn/error browser ke Sentry Logs. Level info/log sengaja
    // tidak ikut: terlalu berisik dan memakan kuota (info tetap ada di Loki).
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],
});

// Instrumentasi navigasi App Router (Next 15.3+): transisi route jadi span.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

try {
  installErrorListeners();
} catch {
  // Pelapor galat tidak boleh menjatuhkan aplikasi.
}

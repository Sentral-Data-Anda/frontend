import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

// Satu ID per build untuk generateBuildId dan URL service worker (`/sw.js?v=<id>`).
// Urutan: BUILD_ID dari CI/Docker, commit SHA Vercel, lalu timestamp lokal.
const buildId =
  process.env.BUILD_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  `local-${Date.now()}`;

const nextConfig: NextConfig = {
  // Output ramping untuk Docker (multi-stage runner).
  output: "standalone",

  // Standalone tidak otomatis menyalin modul yang di-import dinamis oleh Sentry
  // (diagnostics-channel), sehingga warning "Failed to register ... hooks" muncul.
  // Paksa ikutkan paketnya supaya span server tetap terekam.
  outputFileTracingIncludes: {
    "/**/*": ["./node_modules/@sentry/server-runtime-injection/**/*"],
  },

  generateBuildId: async () => buildId,

  // Lencana "N" menutupi tab Dashboard di bottom tab saat review mobile.
  devIndicators: false,

  // Proxy menyangga badan permintaan; bawaan 10 MB memotong unggahan multipart
  // (be-sada: 5 berkas x 10 MB + field) tanpa galat.
  experimental: {
    proxyClientMaxBodySize: "52mb",
  },

  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Sentry browser profiling butuh header ini agar JS Self-Profiling API aktif.
          { key: "Document-Policy", value: "js-profiling" },
          // SAMEORIGIN hanya di development, untuk iframe `/dev/preview`.
          // Pasangannya `frame-ancestors` di src/lib/security/csp.ts.
          {
            key: "X-Frame-Options",
            value:
              process.env.NODE_ENV === "development" ? "SAMEORIGIN" : "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        // Tanpa no-store service worker basi nyangkut; pasangannya updateViaCache: "none".
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Belum ada SENTRY_AUTH_TOKEN: source map tidak diunggah (build tetap jalan).
  // Kalau nanti punya auth token, hapus baris ini untuk stack trace terbaca.
  sourcemaps: { disable: true },
  // Event dikirim lewat domain sendiri (/monitoring) supaya tidak diblokir ad-blocker.
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true,
  // Jangan kirim telemetry build ke Sentry.
  telemetry: false,
});

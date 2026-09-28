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

export default nextConfig;

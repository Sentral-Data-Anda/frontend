import type { NextConfig } from "next";

/**
 * Identitas satu build, dipakai dua tempat sekaligus:
 *
 * - `generateBuildId` — supaya beberapa container yang menyajikan build yang
 *   sama memakai ID yang sama (kalau berbeda, aset antar-container tidak
 *   cocok dan navigasi bisa memuat chunk yang tidak ada).
 * - `NEXT_PUBLIC_BUILD_ID` — distempel ke URL registrasi service worker
 *   (`/sw.js?v=<id>`). Browser membandingkan service worker per-URL, jadi
 *   inilah yang membuat build baru benar-benar terdeteksi sebagai versi baru.
 *   Tanpa ini, cache lama nyangkut selamanya.
 *
 * Urutan sumbernya, dari yang paling bisa ditelusuri:
 *
 * 1. `BUILD_ID` — diisi eksplisit di CI/Docker dengan commit SHA.
 * 2. `VERCEL_GIT_COMMIT_SHA` — disediakan Vercel sendiri. Vercel TIDAK
 *    menyetel `BUILD_ID`, jadi tanpa langkah ini setiap deploy jatuh ke
 *    timestamp: tetap unik (service worker tetap terdeteksi baru), tapi tidak
 *    bisa ditelusuri balik ke commit mana pun saat menyelidiki laporan error.
 * 3. Timestamp — jaring terakhir untuk build lokal.
 */
const buildId =
  process.env.BUILD_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  `local-${Date.now()}`;

const nextConfig: NextConfig = {
  // Output ramping untuk Docker (multi-stage runner).
  output: "standalone",

  generateBuildId: async () => buildId,

  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },

  async headers() {
    return [
      {
        // Header keamanan global, berlaku untuk seluruh rute.
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
        // Tanpa no-store, service worker basi bisa nyangkut di browser dan
        // perbaikan berikutnya tidak pernah sampai ke user. Digandeng dengan
        // `updateViaCache: "none"` saat registrasi — keduanya diperlukan.
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

  // Daftarkan host gambar dari API/CDN eksternal di sini bila memakai next/image.
  // images: {
  //   remotePatterns: [{ protocol: "https", hostname: "cdn.gkigraharaya.org" }],
  // },
};

export default nextConfig;

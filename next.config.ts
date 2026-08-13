import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output ramping untuk Docker (multi-stage runner).
  output: "standalone",

  async headers() {
    return [
      {
        // Header keamanan global, berlaku untuk seluruh rute.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        // Service worker belum ada di repo ini, tapi header-nya disiapkan
        // lebih dulu (lihat docs/superpowers/specs/2026-08-13-sada-pwa-architecture-design.md
        // §5.5). Tanpa no-store, service worker basi bisa nyangkut di
        // browser dan perbaikan berikutnya tidak pernah sampai ke user.
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

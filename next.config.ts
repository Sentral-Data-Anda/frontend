import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output ramping untuk Docker (multi-stage runner).
  output: "standalone",

  // Daftarkan host gambar dari API/CDN eksternal di sini bila memakai next/image.
  // images: {
  //   remotePatterns: [{ protocol: "https", hostname: "cdn.gkigraharaya.org" }],
  // },
};

export default nextConfig;

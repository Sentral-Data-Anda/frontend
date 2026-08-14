import { ImageResponse } from "next/og";

import { brand } from "@/config/brand";

/**
 * Ikon home screen iOS.
 *
 * iOS MENGABAIKAN `icons` di manifest untuk home screen dan hanya membaca
 * `apple-touch-icon`, jadi berkas ini bukan duplikat — tanpa ini, ikon SADA di
 * iPhone jatuh ke tangkapan layar halaman.
 *
 * Dua aturan iOS yang mudah kena:
 * - Tanpa transparansi. Area transparan dirender hitam.
 * - Tanpa sudut membulat. iOS membulatkan sendiri; kalau sudah dibulatkan di
 *   sini hasilnya bulat dobel dengan tepi yang aneh.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: brand.icon.background,
        color: brand.icon.foreground,
        fontSize: 52,
        fontWeight: 700,
        letterSpacing: "-2px",
      }}
    >
      {brand.wordmark}
    </div>,
    { ...size },
  );
}

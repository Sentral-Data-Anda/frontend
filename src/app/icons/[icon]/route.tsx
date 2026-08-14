import { ImageResponse } from "next/og";

import { brand } from "@/config/brand";

/**
 * Generator ikon manifest.
 *
 * Empat berkas berbeda, bukan satu yang di-resize — lihat §4.2 spec:
 *
 * - `any`      — dipakai apa adanya oleh desktop dan dialog instalasi. Punya
 *                sudut membulat sendiri karena tidak akan dipotong siapa pun.
 * - `maskable` — Android memotongnya menjadi lingkaran/squircle. Latarnya
 *                harus full-bleed (tanpa sudut membulat, tanpa margin), dan
 *                isinya wajib berada di dalam SAFE ZONE: lingkaran berdiameter
 *                80% dari sisi ikon. Apa pun di luar itu bisa terpotong.
 *
 * `purpose: "any maskable"` pada satu berkas SENGAJA tidak dipakai. Sintaksnya
 * sah, tapi artinya satu gambar melayani dua peran: Android akan memotongnya,
 * sementara desktop menampilkan versi ber-padding sehingga logo tampak
 * kekecilan.
 *
 * Rute ini statis — `generateStaticParams` di bawah membuat keempatnya
 * di-prerender saat `next build`, jadi tidak ada rendering saat runtime.
 */
export const dynamic = "force-static";

type IconVariant = {
  size: number;
  maskable: boolean;
};

const ICONS: Record<string, IconVariant> = {
  "icon-192": { size: 192, maskable: false },
  "icon-512": { size: 512, maskable: false },
  "maskable-192": { size: 192, maskable: true },
  "maskable-512": { size: 512, maskable: true },
};

export function generateStaticParams() {
  return Object.keys(ICONS).map((icon) => ({ icon }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ icon: string }> },
) {
  const { icon } = await params;
  const variant = ICONS[icon];

  if (!variant) {
    return new Response("Not Found", { status: 404 });
  }

  const { size, maskable } = variant;

  // Safe zone maskable adalah lingkaran berdiameter 80% sisi ikon. Wordmark
  // 4 huruf pada rasio 0.26 memakai kira-kira 62% lebar ikon — nyaman di
  // dalam safe zone bahkan setelah dipotong menjadi lingkaran.
  const fontSize = Math.round(size * (maskable ? 0.26 : 0.29));

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
        fontSize,
        fontWeight: 700,
        letterSpacing: `-${Math.round(fontSize * 0.04)}px`,
        // Ikon `any` tidak pernah dipotong platform, jadi sudut membulatnya
        // dibuat sendiri. Ikon maskable HARUS full-bleed — sudut membulat di
        // sini akan terlihat sebagai celah setelah Android memotongnya.
        borderRadius: maskable ? 0 : Math.round(size * 0.22),
      }}
    >
      {brand.wordmark}
    </div>,
    { width: size, height: size },
  );
}

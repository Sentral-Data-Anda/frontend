import { NextResponse, type NextRequest } from "next/server";

import { buildContentSecurityPolicy, generateNonce } from "@/lib/security/csp";

/**
 * Proxy — di Next 16 konvensi `middleware` sudah diganti nama menjadi `proxy`.
 *
 * Saat ini isinya HANYA Content Security Policy. Tidak ada logika auth di sini;
 * itu ditulis nanti bersama desain auth.
 *
 * =====================================================================
 * BACA SEBELUM MENAMBAH LOGIKA AUTH DI BERKAS INI
 * =====================================================================
 * `config.matcher` di bawah mengecualikan aset PWA. Pengecualian itu WAJIB
 * tetap ada saat pengalihan auth ditambahkan.
 *
 * Bila `/manifest.webmanifest` ikut dialihkan ke `/login`, browser menerima
 * HTML alih-alih JSON, menganggap manifest tidak valid, dan tombol install
 * HILANG TANPA PESAN ERROR APA PUN. Bila `/sw.js` yang dialihkan, registrasi
 * service worker gagal diam-diam dan push notification mati total. Keduanya
 * tidak memunculkan apa pun di console — ini bug tersulit didiagnosis pada
 * aplikasi terautentikasi.
 *
 * Pengecualian ditulis di `matcher`, bukan sebagai percabangan `if` di dalam
 * badan fungsi, supaya tidak bisa terlewat ketika orang menambah cabang logika
 * baru di bawah.
 */
export function proxy(request: NextRequest) {
  const nonce = generateNonce();
  const csp = buildContentSecurityPolicy({
    nonce,
    isDev: process.env.NODE_ENV === "development",
  });

  // Header CSP diteruskan pada REQUEST, bukan hanya pada respons. Dari situlah
  // Next membaca nilai `'nonce-...'` lalu menempelkannya otomatis ke skrip
  // framework, bundel halaman, dan gaya inline yang ia hasilkan sendiri.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Dan pada respons, supaya browser benar-benar menegakkannya.
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    {
      /**
       * Yang dikecualikan dan alasannya:
       *
       * - `api`            — respons JSON, bukan dokumen; CSP tidak berlaku
       * - `_next/static`   — aset build ber-hash
       * - `_next/image`    — hasil optimasi gambar
       * - `manifest.webmanifest`, `sw.js`, `icons`, `apple-icon`, `icon`,
       *   `favicon.ico` — ASET PWA. Lihat peringatan di atas.
       */
      source:
        "/((?!api|_next/static|_next/image|manifest\\.webmanifest|sw\\.js|icons|apple-icon|icon|favicon\\.ico).*)",

      /**
       * Lewati prefetch dari `next/link`. Prefetch tidak pernah dieksekusi
       * sebagai dokumen, jadi nonce untuknya terbuang — dan membuat nonce
       * untuk setiap prefetch berarti kerja acak kriptografis sia-sia pada
       * aplikasi dengan sidebar berisi belasan tautan.
       */
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

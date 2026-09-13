import { NextResponse, type NextRequest } from "next/server";

import { refreshSession } from "@/features/auth/refresh";
import { buildContentSecurityPolicy, generateNonce } from "@/lib/security/csp";

/**
 * Proxy — di Next 16 konvensi `middleware` sudah diganti nama menjadi `proxy`.
 *
 * Isinya Content Security Policy, gerbang auth, dan penyegaran access token.
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
const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

/** Halaman yang boleh dibuka tanpa sesi. */
const PUBLIC_PATHS = new Set(["/login", "/authentication"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Panggilan API tidak menerima CSP (responsnya JSON, bukan dokumen) dan
  // tidak boleh dialihkan ke halaman login: XHR yang mengikuti pengalihan ke
  // HTML akan gagal parse, dan pemanggil menerima galat yang tidak
  // menjelaskan apa-apa. Yang diterimanya adalah 401.
  const isApiRequest = pathname.startsWith("/api/");

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  // Sama sekali belum masuk.
  if (!accessToken && !refreshToken) {
    if (isApiRequest || PUBLIC_PATHS.has(pathname)) {
      return onContinue(request, { isApiRequest });
    }

    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url),
    );
  }

  // Access token kedaluwarsa — browser menghapusnya sendiri saat Max-Age habis,
  // jadi ketidakhadirannya di samping refresh token yang masih ada berarti
  // persis "perlu disegarkan". Tidak ada token yang diverifikasi di sini; FE
  // tidak memegang kunci tanda tangan be-sada dan tidak perlu.
  if (!accessToken && refreshToken) {
    const refreshed = await refreshSession(
      request.headers.get("cookie") ?? "",
      refreshToken,
    );

    if (!refreshed) {
      // Keduanya NextResponse, supaya cookie mati ikut dibuang pada kedua
      // jalur. Kalau cabang API memakai `Response` biasa, XHR yang menemukan
      // sesi mati akan meninggalkan cookie basi di browser, dan setiap
      // permintaan berikutnya mengulang penyegaran yang sudah pasti gagal.
      const response = isApiRequest
        ? NextResponse.json(
            { status: 401, error: "Sesi Anda telah berakhir." },
            { status: 401 },
          )
        : NextResponse.redirect(new URL("/login", request.url));

      // Dibuang di sini, bukan diandalkan dari be-sada: Set-Cookie pembersih
      // miliknya membawa atribut Domain yang tidak cocok dengan origin ini,
      // sehingga browser mengabaikannya dan cookie basi menetap selamanya.
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);

      return response;
    }

    return onContinue(request, {
      isApiRequest,
      cookieHeader: refreshed.cookieHeader,
      setCookie: refreshed.setCookie,
    });
  }

  // Sudah masuk tapi masih berada di halaman login — kirim ke gerbang.
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/authentication", request.url));
  }

  return onContinue(request, { isApiRequest });
}

const onContinue = (
  request: NextRequest,
  options: {
    isApiRequest: boolean;
    cookieHeader?: string;
    setCookie?: string[];
  },
) => {
  const requestHeaders = new Headers(request.headers);

  // Cookie hasil penyegaran ditulis ke header REQUEST juga, bukan hanya ke
  // respons. Tanpa ini, permintaan yang sedang berjalan tetap membawa cookie
  // lama dan be-sada menjawabnya 401 — penyegarannya baru terasa pada
  // permintaan berikutnya, sehingga setiap kedaluwarsa memunculkan satu
  // kegagalan yang terlihat user.
  if (options.cookieHeader) {
    requestHeaders.set("cookie", options.cookieHeader);
  }

  let nonce: string | null = null;

  if (!options.isApiRequest) {
    nonce = generateNonce();

    const csp = buildContentSecurityPolicy({
      nonce,
      isDev: process.env.NODE_ENV === "development",
    });

    // Header CSP diteruskan pada REQUEST, bukan hanya pada respons. Dari
    // situlah Next membaca nilai `'nonce-...'` lalu menempelkannya otomatis
    // ke skrip framework, bundel halaman, dan gaya inline yang ia hasilkan
    // sendiri.
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Dan pada respons, supaya browser benar-benar menegakkannya.
    response.headers.set("Content-Security-Policy", csp);

    for (const cookie of options.setCookie ?? []) {
      response.headers.append("set-cookie", cookie);
    }

    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  for (const cookie of options.setCookie ?? []) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
};

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
    {
      /**
       * Panggilan API ikut lewat sini semata untuk penyegaran token. CSP tidak
       * dipasang di sini (responsnya JSON) dan pengalihan tidak pernah terjadi
       * — lihat `isApiRequest` di badan fungsi.
       *
       * Tanpa entri ini, XHR yang tiba setelah access token kedaluwarsa akan
       * menerima 401 walau sesi user sebenarnya masih hidup.
       */
      source: "/api/:path*",
    },
  ],
};

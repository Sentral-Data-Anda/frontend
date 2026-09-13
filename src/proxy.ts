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
 *
 * =====================================================================
 * KENAPA DETEKSI PREFETCH ADA DI BADAN FUNGSI, BUKAN DI `matcher`
 * =====================================================================
 * Sebelumnya `matcher` punya klausa `missing` yang melewatkan permintaan
 * prefetch `next/link` (header `next-router-prefetch` atau
 * `purpose: prefetch`) SUPAYA proxy tidak jalan sama sekali untuknya — murni
 * optimasi, karena prefetch tidak pernah dieksekusi sebagai dokumen dan
 * nonce untuknya terbuang percuma.
 *
 * Begitu gerbang auth ditambahkan ke fungsi yang sama, klausa itu diam-diam
 * ikut melewatkan GERBANG AUTH: permintaan berheader prefetch tidak pernah
 * masuk fungsi ini sama sekali, jadi tidak pernah dicek sesi. Halaman
 * terlindungi kebetulan aman lewat pertahanan kedua (`getSession()` di
 * layout), tapi itu bukan sesuatu yang boleh diandalkan diam-diam.
 *
 * Karena itu pemisahan ini disengaja: `matcher` hanya menentukan APA yang
 * dijalankan (termasuk prefetch — supaya gerbang auth tetap menjaganya),
 * dan `isPrefetchRequest` di bawah, dipakai di `onContinue`, yang menentukan
 * apakah nonce perlu dibuat. Pengecualian KEAMANAN (aset PWA, di `source`)
 * tetap di matcher — itu memang harus sulit dilewatkan. Yang pindah ke sini
 * hanya OPTIMASI (lewati nonce untuk prefetch), karena optimasi dan
 * pengecualian keamanan tidak boleh hidup berdampingan di satu tempat yang
 * sama-sama mengontrol "apakah proxy jalan sama sekali".
 */
const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

/** Halaman yang boleh dibuka tanpa sesi. */
const PUBLIC_PATHS = new Set(["/login", "/authentication"]);

/**
 * Prefetch: tidak pernah dieksekusi sebagai dokumen, jadi nonce dan header
 * CSP untuknya terbuang. Deteksi ini HANYA memengaruhi apakah nonce dibuat
 * (lihat `onContinue`) — tidak pernah dipakai untuk melewati gerbang auth
 * di atasnya.
 *
 * CATATAN PENTING soal `next-router-prefetch`: header ini praktiknya TIDAK
 * PERNAH terlihat di sini. Next.js menghapus seluruh `FLIGHT_HEADERS`
 * (`rsc`, `next-router-state-tree`, `next-router-prefetch`, `next-hmr-
 * refresh`, `next-router-segment-prefetch`) dari header yang diteruskan ke
 * proxy/middleware SEBELUM fungsi ini dipanggil — lihat
 * `node_modules/next/dist/server/web/adapter.js` (komentar di sana:
 * "Headers should only be stripped for middleware"). Dibuktikan langsung
 * lewat `console.log` sementara di titik ini: `curl -H
 * "next-router-prefetch: 1"` tidak memunculkan header itu sama sekali di
 * `request.headers`, sedangkan `curl -H "purpose: prefetch"` (bukan header
 * internal Next) tetap terlihat apa adanya. Klausa `next-router-prefetch` di
 * bawah karena itu sekarang no-op — dipertahankan untuk kompatibilitas ke
 * depan bila perilaku Next berubah, bukan karena ia bekerja hari ini.
 * `purpose: prefetch` adalah satu-satunya sinyal yang benar-benar melewati
 * pembuatan nonce saat ini.
 *
 * Ini TIDAK melemahkan perbaikan gerbang auth: keputusan matcher (APAKAH
 * proxy dipanggil sama sekali) dievaluasi Next terhadap header request
 * ASLI, sebelum penghapusan `FLIGHT_HEADERS` di atas — itu sebabnya
 * menghapus klausa `missing` dari matcher (lih. blok komentar di atas)
 * sudah cukup untuk membuat prefetch `next/link` ikut lewat gerbang auth,
 * terlepas dari apa yang bisa dibaca fungsi ini dari headernya.
 */
const isPrefetchRequest = (request: NextRequest): boolean =>
  request.headers.has("next-router-prefetch") ||
  request.headers.get("purpose") === "prefetch";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Panggilan API tidak menerima CSP (responsnya JSON, bukan dokumen) dan
  // tidak boleh dialihkan ke halaman login: XHR yang mengikuti pengalihan ke
  // HTML akan gagal parse, dan pemanggil menerima galat yang tidak
  // menjelaskan apa-apa. Yang diterimanya adalah 401.
  //
  // `/api` telanjang (tanpa garis miring) ikut dihitung: matcher
  // `"/api/:path*"` mencocokkannya juga, dan tanpa baris ini permintaan itu
  // akan lolos ke cabang halaman lalu dialihkan ke `/login` dengan CSP
  // terpasang alih-alih diperlakukan sebagai panggilan API.
  const isApiRequest = pathname === "/api" || pathname.startsWith("/api/");

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

  let cookieHeader: string | undefined;
  let setCookie: string[] | undefined;

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

    cookieHeader = refreshed.cookieHeader;
    setCookie = refreshed.setCookie;
  }

  // Sudah masuk — baik lewat access token yang masih hidup maupun baru saja
  // disegarkan di atas — tapi masih berada di halaman login: kirim ke
  // gerbang. Dicek SESUDAH cabang penyegaran (bukan hanya sebelumnya) supaya
  // user yang access token-nya kedaluwarsa persis saat memuat ulang `/login`
  // ikut diarahkan ke `/authentication`, bukan disajikan halaman login lagi.
  // Cookie hasil penyegaran (bila ada) ikut dipasang pada respons pengalihan
  // ini, supaya tidak hilang begitu saja.
  if (pathname === "/login") {
    const response = NextResponse.redirect(
      new URL("/authentication", request.url),
    );

    for (const cookie of setCookie ?? []) {
      response.headers.append("set-cookie", cookie);
    }

    return response;
  }

  return onContinue(request, { isApiRequest, cookieHeader, setCookie });
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

  // CSP dilewati untuk panggilan API (JSON, bukan dokumen) dan untuk
  // prefetch `next/link` (tidak pernah dieksekusi sebagai dokumen). Lihat
  // blok komentar "KENAPA DETEKSI PREFETCH ADA DI BADAN FUNGSI" di atas
  // untuk alasan kenapa pengecekan prefetch ini tidak lagi hidup di
  // `matcher`.
  if (!options.isApiRequest && !isPrefetchRequest(request)) {
    const nonce = generateNonce();

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
       *
       * Prefetch `next/link` SENGAJA TIDAK dikecualikan di sini lagi — lihat
       * blok komentar "KENAPA DETEKSI PREFETCH ADA DI BADAN FUNGSI" di atas.
       * Gerbang auth harus tetap berjalan untuknya; hanya pembuatan nonce
       * yang dilewati, dan itu diputuskan di `onContinue`.
       */
      source:
        "/((?!api|_next/static|_next/image|manifest\\.webmanifest|sw\\.js|icons|apple-icon|icon|favicon\\.ico).*)",
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

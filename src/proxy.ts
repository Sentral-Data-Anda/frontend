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
 * `/offline` TERMASUK ASET PWA, walau ia halaman. Ia entri pertama
 * `PRECACHE_URLS` di `public/sw.js`, dan `ServiceWorkerProvider` dipasang di
 * root layout sehingga service worker mendaftar juga di `/login` — artinya
 * `install` berjalan justru saat user masih ANONIM. `cache.addAll` mengikuti
 * pengalihan, lalu `Cache.put` MENOLAK respons yang `redirected`, sehingga
 * `install` gagal SELURUHNYA: bukan cuma `/offline` yang hilang, tapi seluruh
 * precache berikut fallback offline-nya. Kunjungan pertama hampir selalu
 * anonim, jadi bagi hampir semua user PWA-nya tidak pernah terpasang sama
 * sekali — tanpa satu pun pesan error.
 *
 * `/robots.txt` juga dikecualikan, dan alasannya bukan PWA melainkan
 * kebocoran. `src/app/robots.ts` menerbitkan `disallow: "/"` — sinyal
 * no-index untuk aplikasi yang isinya data jemaat. Kalau berkas itu
 * dialihkan, crawler tidak pernah membacanya, dan sebagian crawler
 * memperlakukan robots.txt yang mengalihkan sebagai "tidak ada robots.txt" =
 * boleh crawl. Pengalihan di sini membalik default-aman menjadi default
 * terbuka, persis kebalikan dari yang diputuskan.
 *
 * Pengecualian ditulis di `matcher`, bukan sebagai percabangan `if` di dalam
 * badan fungsi, supaya tidak bisa terlewat ketika orang menambah cabang logika
 * baru di bawah.
 *
 * =====================================================================
 * KENAPA PREFETCH TIDAK DIKECUALIKAN DI `matcher`
 * =====================================================================
 * `matcher` pernah punya klausa `missing` yang melewatkan permintaan prefetch
 * `next/link` (header `next-router-prefetch` atau `purpose: prefetch`) SUPAYA
 * proxy tidak jalan sama sekali untuknya — murni optimasi, karena prefetch
 * tidak pernah dieksekusi sebagai dokumen dan nonce untuknya terbuang.
 *
 * Begitu gerbang auth pindah ke fungsi yang sama, klausa itu diam-diam ikut
 * melewatkan GERBANG AUTH: permintaan berheader prefetch tidak pernah masuk
 * fungsi ini sama sekali, jadi tidak pernah dicek sesi. Halaman terlindungi
 * kebetulan aman lewat pertahanan kedua (`getSession()` di layout), tapi itu
 * bukan sesuatu yang boleh diandalkan diam-diam.
 *
 * JANGAN KEMBALIKAN KLAUSA ITU. `matcher` hanya boleh mengecualikan hal yang
 * bukan dokumen sama sekali (aset PWA, aset build). Prefetch adalah dokumen —
 * ia harus lewat gerbang, dan biaya satu nonce untuknya tidak pernah terbukti
 * jadi masalah: deteksi prefetch berbasis header sebelumnya justru dihapus
 * setelah terbukti tidak pernah cocok dengan permintaan nyata (Next membuang
 * `next-router-prefetch` sebelum proxy melihatnya, dan `next/link` tidak
 * pernah mengirim `purpose: prefetch`), sementara cabangnya adalah satu-
 * satunya jalan keluar `onContinue` tanpa CSP — dan itu dikendalikan header
 * yang dikirim klien.
 */
const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

/**
 * Halaman yang boleh dibuka tanpa sesi.
 *
 * `/dev/preview` ikut HANYA di development (di production halamannya 404).
 * Tanpa itu `?path=/login` tidak pernah bisa dipratinjau: tanpa sesi,
 * halaman pratinjaunya sendiri dialihkan ke `/login`; dengan sesi, `/login`
 * di dalam iframe dialihkan ke `/authentication`. Halaman pratinjau tidak
 * memuat data apa pun — setiap iframe di dalamnya tetap lewat gerbang ini
 * sendiri-sendiri.
 */
const PUBLIC_PATHS = new Set([
  "/login",
  "/authentication",
  ...(process.env.NODE_ENV === "development" ? ["/dev/preview"] : []),
]);

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

    // `search` ikut, bukan `pathname` saja. Cookie be-sada `SameSite=Strict`,
    // jadi deep link dari luar (WhatsApp, email, klik notifikasi push) TIDAK
    // membawa cookie pada navigasi pertama dan selalu mendarat di sini. Kalau
    // querynya dibuang, `/kejemaatan/daftar-jemaat?page=3&search=budi` kembali
    // sebagai halaman satu tanpa filter — tautan yang dikirim orang lain tidak
    // pernah membuka apa yang dimaksudkannya.
    const target = `${pathname}${request.nextUrl.search}`;

    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(target)}`, request.url),
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
    // `redirect` yang sudah ada di URL ikut dibawa. Tanpa ini, deep link yang
    // baru saja dialihkan ke `/login?redirect=...` oleh cabang di atas
    // kehilangan tujuannya di lompatan berikutnya: `/authentication` tidak
    // menerima parameter apa pun, lalu memanggil `redirect("/")` dan user
    // mendarat di beranda — bukan di layar yang tautannya ia buka.
    const url = new URL("/authentication", request.url);
    const redirect = request.nextUrl.searchParams.get("redirect");

    // Nilainya diteruskan mentah; `isSafeRedirectPath` di `/authentication`
    // yang memvalidasinya, sama seperti nilai yang datang lewat `/login`.
    if (redirect) url.searchParams.set("redirect", redirect);

    const response = NextResponse.redirect(url);

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

  // CSP hanya dilewati untuk panggilan API — responsnya JSON, bukan dokumen,
  // jadi tidak ada yang bisa ditegakkan CSP di sana. Setiap jalan lain keluar
  // dari fungsi ini MEMBAWA CSP; itu properti yang sengaja dijaga, karena
  // pengecualian berbasis header yang dikirim klien pernah ada di sini dan
  // hanya menghasilkan satu celah tanpa manfaat terukur.
  let csp: string | null = null;

  if (!options.isApiRequest) {
    const nonce = generateNonce();

    csp = buildContentSecurityPolicy({
      nonce,
      isDev: process.env.NODE_ENV === "development",
    });

    // Header CSP diteruskan pada REQUEST, bukan hanya pada respons. Dari
    // situlah Next membaca nilai `'nonce-...'` lalu menempelkannya otomatis
    // ke skrip framework, bundel halaman, dan gaya inline yang ia hasilkan
    // sendiri.
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Dan pada respons, supaya browser benar-benar menegakkannya.
  if (csp) response.headers.set("Content-Security-Policy", csp);

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
       *   `favicon.ico`, `offline` — ASET PWA. Lihat peringatan di atas;
       *   `offline` yang dialihkan mematikan SELURUH precache, bukan hanya
       *   dirinya sendiri.
       * - `robots.txt`     — sinyal no-index. Dialihkan berarti crawler tidak
       *   pernah membacanya. Lihat peringatan di atas.
       *
       * Prefetch `next/link` SENGAJA TIDAK dikecualikan di sini — lihat blok
       * komentar "KENAPA PREFETCH TIDAK DIKECUALIKAN DI `matcher`" di atas.
       *
       * TIAP ALTERNATIF DIAKHIRI `(?:/|$)`, dan itu bukan kosmetik. Tanpa
       * batas itu daftarnya berupa awalan telanjang: `/apixyz` ikut tersaring
       * oleh `api`, `/iconografi` oleh `icon`, `/login-sso` oleh `login` bila
       * suatu saat ada di daftar. Terbukti hidup — keduanya yang pertama
       * membalas 404 TANPA header CSP sama sekali, artinya proxy tidak jalan.
       * Sekarang gerbang auth tinggal di fungsi yang sama, jadi satu nama
       * rute yang tidak beruntung mematikan GERBANG AUTH sekaligus CSP,
       * diam-diam.
       *
       * `apple-icon.png` dan `icon.png` DITULIS LENGKAP DENGAN EKSTENSINYA.
       * Dokumentasi Next menyebut metadata file konvensi itu disajikan di
       * `/icon?<hash>`, tapi `next build` pada versi ini melaporkan rutenya
       * sebagai `/apple-icon.png` dan `/icon.png` — dan yang menentukan adalah
       * rute yang benar-benar dibangun, bukan dokumennya. Kalau ekstensi
       * berkasnya di `src/app/` diganti (mis. ke `.svg`), daftar ini ikut
       * diganti; periksa keluaran `next build` sesudahnya.
       *
       * `icons` (jamak, direktori di `public/`) berbeda dari `icon.png` dan
       * keduanya memang perlu ada di daftar. `offline` tanpa ekstensi karena
       * ia halaman (`src/app/offline/page.tsx`), `robots\.txt` dengan titik
       * ter-escape karena ia berkas.
       */
      source:
        "/((?!(?:api|_next/static|_next/image|manifest\\.webmanifest|sw\\.js|icons|apple-icon\\.png|icon\\.png|favicon\\.ico|offline|robots\\.txt)(?:/|$)).*)",
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

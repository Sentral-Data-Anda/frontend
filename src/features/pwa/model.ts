/**
 * Logika murni fitur PWA: deteksi platform/mode tampilan, dan aturan
 * registrasi service worker. Tanpa React, tanpa fetch.
 *
 * ## Deteksi platform dan mode tampilan
 *
 * Fungsi-fungsi di sini menyentuh `window`/`navigator`, jadi hanya boleh
 * dipanggil dari efek atau event handler di komponen client — tidak pernah
 * saat render, karena Server Component akan meledak.
 */

/** Apakah aplikasi sedang berjalan sebagai PWA terpasang (bukan tab browser)? */
export function isStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // `navigator.standalone` adalah properti non-standar khusus Safari iOS —
  // satu-satunya cara mendeteksi mode home screen di sana pada versi lama.
  const iosStandalone = (
    window.navigator as Navigator & { standalone?: boolean }
  ).standalone;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    iosStandalone === true
  );
}

/** Apakah perangkat ini iOS (termasuk iPadOS yang menyamar sebagai Mac)? */
export function isIOS(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const ua = window.navigator.userAgent;

  // iPadOS 13+ melaporkan dirinya sebagai "Macintosh". Yang membedakannya dari
  // Mac sungguhan adalah adanya touch — Mac melaporkan maxTouchPoints 0.
  const isIPadOS = /Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1;

  return /iPad|iPhone|iPod/.test(ua) || isIPadOS;
}

/**
 * Apakah instalasi di perangkat ini hanya bisa lewat panduan manual?
 *
 * Safari iOS tidak pernah memunculkan prompt instalasi otomatis dan tidak
 * mendukung event `beforeinstallprompt`. Satu-satunya jalan adalah
 * "Bagikan → Tambahkan ke Layar Utama", jadi UI harus memandu, bukan
 * menampilkan tombol yang diam saja saat diklik.
 *
 * Ini juga yang memblokir push di iOS: `PushManager` baru muncul SETELAH
 * aplikasi terpasang ke Layar Utama (iOS 16.4+).
 */
export function needsManualInstallGuide(): boolean {
  return isIOS() && !isStandalone();
}

// ---- Registrasi service worker ----------------------------------------

/**
 * URL registrasi service worker, lengkap dengan stempel versi build.
 *
 * Browser membandingkan service worker per-URL. Karena `public/sw.js`
 * disajikan apa adanya dan isinya tidak berubah antar build, tanpa query ini
 * browser tidak pernah melihat versi baru dan cache lama nyangkut selamanya.
 * Query `?v=` membuat setiap build menjadi resource yang berbeda, sehingga
 * `install` menyala. Service worker membaca nilainya kembali lewat
 * `new URL(self.location).searchParams.get("v")` untuk menamai cache-nya.
 *
 * `NEXT_PUBLIC_BUILD_ID` diisi saat build. Bila kosong (mis. dev), nilainya
 * jatuh ke "dev" — di dev memang tidak ada versi yang perlu dibedakan.
 */
export function serviceWorkerUrl(): string {
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || "dev";
  return `/sw.js?v=${encodeURIComponent(buildId)}`;
}

/**
 * Apakah service worker boleh didaftarkan di environment ini?
 *
 * Di `next dev`, service worker aktif menimbulkan cache basi yang membingungkan
 * — perubahan tidak muncul dan orang mengira kodenya salah. Tapi mematikannya
 * total berarti tidak bisa diuji sama sekali, jadi ada flag untuk membukanya
 * secara sadar.
 *
 * Pengujian lokal butuh `bun run dev --experimental-https`: service worker dan
 * Push API menolak origin non-HTTPS (kecuali localhost untuk sebagian API).
 */
export function shouldRegisterServiceWorker(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_ENABLE_SW === "1"
  );
}

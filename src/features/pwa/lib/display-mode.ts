/**
 * Deteksi platform dan mode tampilan.
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

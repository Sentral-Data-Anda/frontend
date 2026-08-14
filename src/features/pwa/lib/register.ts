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

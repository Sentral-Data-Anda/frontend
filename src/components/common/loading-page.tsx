import styles from "./loading-page.module.css";

/**
 * Layar tunggu penuh dengan animasi huruf S · A · D (bootstrap dan
 * `app/loading.tsx`).
 *
 * Jendela tampil (keputusan user 2026-09-23) dijalankan **CSS, bukan state
 * React**, dan komponennya sengaja tetap Server Component:
 * - **150ms jeda** sebelum muncul (`animation-delay` + `both`): perpindahan
 *   yang selesai lebih cepat tidak menampilkan apa pun — tanpa kedipan dan
 *   tanpa waktu tambahan.
 * - **800ms gerakan** yang berhenti diam, lalu denyut halus. Berapa pun ia
 *   sempat tampil, yang terlihat adalah gerakan yang selesai, bukan potongan.
 *
 * Versi sebelumnya menahan jeda ini dengan `useState` + timer di klien, dan
 * itu SALAH di tempat komponen ini paling sering dipakai: `loading.tsx`
 * dirender di server, jadi yang terkirim adalah fallback kosong, dan timernya
 * baru jalan setelah hidrasi — padahal hidrasi tertahan selama boundary-nya
 * menunggu. Refresh penuh dengan server lambat = layar putih berdetik-detik.
 * Dengan CSS, markupnya ikut terkirim di HTML dan jedanya tetap.
 *
 * Batas MINIMUM tampil tidak bisa dipasang dari sini: fallback `loading.tsx`
 * dicabut Next begitu kerja server segmennya selesai. Di layar yang memang
 * butuh (bootstrap `authentication`) penahannya ada di kerja servernya.
 * `LoadingGlobal` (spinner mutation) sengaja tanpa jendela apa pun.
 */
export function LoadingPage() {
  return (
    <div
      role="status"
      aria-busy="true"
      className={`${styles.page} bg-background text-muted-foreground fixed inset-0 z-50 flex items-center justify-center`}
    >
      <div className={styles.stage}>
        <span className={`${styles.letter} ${styles.letterS}`} />
        <span className={`${styles.letter} ${styles.letterA}`} />
        <span className={`${styles.letter} ${styles.letterD}`} />
      </div>

      <span className="sr-only">Memuat…</span>
    </div>
  );
}

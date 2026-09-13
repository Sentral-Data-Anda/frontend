import styles from "./loading-page.module.css";

/**
 * Layar tunggu penuh dengan animasi huruf S · A · D.
 *
 * Dipakai HANYA saat bootstrap — `(auth)/authentication/loading.tsx`. Animasi
 * ini berdurasi 2 detik dan berakhir pada `opacity: 0`, jadi menempatkannya di
 * tunggu pendek (simpan yang selesai 300ms, pindah layar di dalam app shell)
 * hanya memperlihatkan kedipan huruf setengah jalan. Untuk itu ada
 * `LoadingGlobal`.
 */
export function LoadingPage() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="bg-background text-muted-foreground fixed inset-0 z-50 flex items-center justify-center"
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

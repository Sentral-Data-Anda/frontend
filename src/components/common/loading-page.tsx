"use client";

import { useLoadingWindow } from "@/hooks/use-loading-window";

import styles from "./loading-page.module.css";

/**
 * Layar tunggu penuh dengan animasi huruf S · A · D (bootstrap dan
 * `app/loading.tsx`).
 *
 * Jendela tampil (keputusan user 2026-09-23):
 * - **150ms jeda** sebelum muncul: perpindahan yang selesai lebih cepat dari
 *   itu tidak menampilkan apa pun — tidak ada kedipan, dan tidak ada waktu
 *   yang ditambahkan.
 * - **800ms gerakan** yang berhenti diam, lalu denyut halus. Berapa pun ia
 *   sempat tampil, yang terlihat adalah gerakan yang selesai, bukan potongan.
 *
 * Batas MINIMUM tampil tidak bisa dipasang dari sini: fallback `loading.tsx`
 * dicabut Next begitu kerja server segmennya selesai. Di layar yang memang
 * butuh (bootstrap `authentication`) penahannya ada di kerja servernya.
 * `LoadingGlobal` (spinner mutation) sengaja tanpa jendela apa pun.
 */
export function LoadingPage() {
  const isShown = useLoadingWindow(true);

  if (!isShown) return null;

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

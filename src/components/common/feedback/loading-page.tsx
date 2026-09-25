import styles from "./loading-page.module.css";

export const LoadingPage = () => {
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
};

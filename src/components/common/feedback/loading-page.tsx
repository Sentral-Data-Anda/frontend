import { cn } from "@/lib/utils";

import styles from "./loading-page.module.css";

interface PropTypes {
  tone?: "default" | "brand";
}

export const LoadingPage = (props: PropTypes) => {
  const { tone = "default" } = props;

  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        tone === "brand"
          ? "bg-primary text-primary-foreground"
          : `${styles.page} bg-background text-muted-foreground`,
      )}
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

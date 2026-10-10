import type { CSSProperties } from "react";

import styles from "./loading-page.module.css";

interface PropTypes {
  /** Sisi bujur sangkar animasi; jarak geser huruf ikut skala ini. */
  size?: number;
}

/** Tiga huruf logo SADA yang melayang masuk lalu bernapas. */
export const SadaLoader = (props: PropTypes) => {
  const { size = 200 } = props;

  return (
    <div
      className={styles.stage}
      style={{ "--loader-size": `${size}px` } as CSSProperties}
    >
      <span className={`${styles.letter} ${styles.letterS}`} />
      <span className={`${styles.letter} ${styles.letterA}`} />
      <span className={`${styles.letter} ${styles.letterD}`} />
    </div>
  );
};

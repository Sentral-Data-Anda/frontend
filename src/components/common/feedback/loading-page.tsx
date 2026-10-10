import { cn } from "@/lib/utils";

import styles from "./loading-page.module.css";
import { SadaLoader } from "./sada-loader";

interface PropTypes {
  tone?: "default" | "brand";
}

export const LoadingPage = (props: PropTypes) => {
  const { tone = "default" } = props;

  return (
    <div
      role="status"
      aria-busy="true"
      data-loading-page={tone === "default" ? "" : undefined}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        tone === "brand"
          ? "bg-primary text-primary-foreground"
          : `${styles.page} bg-background text-muted-foreground`,
      )}
    >
      <SadaLoader />

      <span className="sr-only">Memuat…</span>
    </div>
  );
};

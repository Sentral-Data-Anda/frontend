export type ToastInput = {
  title: string;
  description?: string;
  type?: "error" | "warning";
};

let emit: ((toast: ToastInput) => void) | null = null;

/** Dipasang sekali oleh ToastHost. Mengembalikan pelepasnya. */
export const connectToast = (next: (toast: ToastInput) => void) => {
  emit = next;

  return () => {
    if (emit === next) emit = null;
  };
};

/**
 * Memunculkan toast dari kode yang bukan komponen, misalnya applyServerError.
 * Tidak melakukan apa-apa bila belum ada ToastHost yang terpasang, sehingga
 * aman dipanggil saat render di server maupun di dalam test.
 */
export const showToast = (toast: ToastInput) => emit?.(toast);

import { SadaLoader } from "./sada-loader";

/**
 * Loading di atas layar yang sudah berisi, dipakai saat berpindah halaman.
 * Latarnya tembus pandang dan diburamkan supaya konteks sebelumnya tetap
 * terbaca. Animasinya sama dengan LoadingPage, yang latarnya solid karena
 * tampil saat belum ada apa pun di belakangnya.
 */
export const LoadingGlobal = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      className="bg-background/60 text-muted-foreground fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
    >
      <SadaLoader size={120} />

      <span className="sr-only">Memuat…</span>
    </div>
  );
};

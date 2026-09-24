import { LoadingPage } from "@/components/common/feedback/loading-page";

/**
 * Batas tunggu paling luar — tampil saat refresh penuh selagi layout
 * (mis. `AppShell` yang membaca cookie) belum siap. Sama dengan bootstrap
 * auth: animasi logo, bukan teks.
 */
export default function Loading() {
  return <LoadingPage />;
}

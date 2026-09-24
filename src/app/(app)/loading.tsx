import { LoadingGlobal } from "@/components/common/feedback/loading-global";

/**
 * Cincin spinner, bukan animasi huruf. Perpindahan antar-layar berlangsung
 * ratusan milidetik; animasi 2 detik hanya sempat terlihat setengah jalan.
 */
export default function Loading() {
  return <LoadingGlobal />;
}

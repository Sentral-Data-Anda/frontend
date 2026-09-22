/**
 * Hanya < lg (HP/tablet). Untuk isi yang di desktop sudah dijawab sidebar,
 * mis. Aksi cepat di Beranda. Media query milik `components/layout`.
 */
export function MobileOnly({ children }: { children: React.ReactNode }) {
  return <div className="lg:hidden">{children}</div>;
}

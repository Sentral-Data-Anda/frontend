export type NavItem = {
  title: string;
  href: string;
};

/** Struktur menu navigasi utama (header & footer). */
export const mainNav: NavItem[] = [
  { title: "Beranda", href: "/" },
  { title: "Tentang", href: "/tentang" },
  { title: "Jadwal Ibadah", href: "/jadwal" },
  { title: "Berita", href: "/berita" },
  { title: "Galeri", href: "/galeri" },
  { title: "Kontak", href: "/kontak" },
];

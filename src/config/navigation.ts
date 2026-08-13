export type NavItem = {
  title: string;
  href: string;
};

/**
 * Struktur menu navigasi utama (header & footer).
 *
 * Lima tautan lama (/tentang, /jadwal, /berita, /galeri, /kontak) dibuang —
 * halaman-halaman itu sudah dihapus saat repo ini berubah dari situs profil
 * menjadi aplikasi SADA, dan sebelumnya masih dirender di sini sehingga
 * site-header/site-footer menerbitkan tautan ke rute 404.
 *
 * Rute yang tersisa hanya "/" (placeholder sampai app shell SADA dibangun).
 * Menu navigasi sesungguhnya untuk aplikasi terautentikasi (sidebar +
 * breadcrumb, keputusan D1) belum dibangun di sini — lihat
 * docs/superpowers/specs/2026-08-13-sada-pwa-architecture-design.md.
 */
export const mainNav: NavItem[] = [{ title: "Beranda", href: "/" }];

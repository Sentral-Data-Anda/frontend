import { Logo } from "@/components/common/logo";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/config/site";

/**
 * Footer sementara.
 *
 * Sebelumnya berupa grid tiga kolom bergaya situs profil: deskripsi, daftar
 * navigasi, dan blok kontak (alamat, telepon, email). Blok kontak dibuang
 * bersama `siteConfig.contact` — isinya nilai contoh, dan alamat gereja bukan
 * informasi yang dicari orang di dalam aplikasi terautentikasi.
 *
 * Daftar navigasi ikut dibuang karena `mainNav` sekarang hanya berisi satu
 * tautan ("/"), dan header sudah menerbitkannya. Menu sesungguhnya untuk
 * aplikasi ini adalah sidebar + breadcrumb (keputusan D1 di spec), yang akan
 * menggantikan header/footer ini begitu app shell dibangun — jadi tata letak
 * di sini sengaja dibuat tipis, bukan dirapikan jadi grid dua kolom yang
 * umurnya pendek.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t">
      <Container className="flex flex-col items-center gap-3 py-8 sm:flex-row sm:justify-between">
        <Logo />
        <p className="text-muted-foreground text-xs">
          © {year} {siteConfig.name}. Hak cipta dilindungi.
        </p>
      </Container>
    </footer>
  );
}

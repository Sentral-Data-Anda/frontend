import { connection } from "next/server";

/**
 * Placeholder rute root.
 *
 * Repo ini sedang dalam tahap penataan arsitektur — seluruh fitur dan halaman
 * company profile sudah dipindahkan keluar. Halaman ini hanya menjaga rute `/`
 * tetap ada sampai app shell SADA dibangun.
 *
 * Lihat docs/superpowers/specs/2026-08-13-sada-pwa-architecture-design.md
 *
 * `await connection()` memaksa render dinamis, dan itu WAJIB selama CSP
 * berbasis nonce aktif: nonce dibuat per-request oleh src/proxy.ts, sementara
 * halaman statis dibangun saat build ketika request belum ada. Halaman statis
 * yang menerima header CSP ber-nonce akan tampil kosong — skrip framework di
 * dalamnya tidak membawa nonce apa pun sehingga diblokir browser.
 */
export default async function HomePage() {
  await connection();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Sentral Data Anda
      </h1>
      <p className="text-muted-foreground mt-3 text-sm">
        Kerangka aplikasi sedang disiapkan.
      </p>
    </div>
  );
}

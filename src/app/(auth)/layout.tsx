import { AuthWaves } from "@/components/common/auth-waves";
import { LogoWordmark } from "@/components/common/logo";

/**
 * Kerangka halaman sebelum masuk, tanpa navigasi.
 *
 * Terpisah dari `(app)` karena app shell (bottom tab, header) tidak boleh
 * muncul di layar yang belum punya sesi — bukan cuma karena jelek, tapi
 * karena tab-tabnya menuju rute yang akan menendang balik ke sini.
 *
 * SELURUH keputusan responsif layar login dan `/authentication` hidup di
 * berkas ini (dikecualikan dari lint breakpoint untuk alasan itu). Halaman di
 * bawahnya bebas breakpoint dan cukup mengisi kartu yang diberikan.
 *
 * Keputusan user: satu susunan untuk semua ukuran — latar `bg-primary`,
 * logo-nama di tengah atas, lalu form di kartu putih. Logo selalu di atas
 * navy karena logo-nama user berwarna terang (dirancang untuk latar gelap).
 * Tinggi kartu mengikuti isinya; padding sama di keempat sisi. Yang berubah
 * per ukuran hanya lebar kartu (`max-w-sm` mulai md) dan padding-nya. Split-screen desktop sudah tidak dipakai.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-primary relative flex min-h-dvh flex-1 flex-col overflow-hidden">
      <AuthWaves className="text-primary-foreground/10 absolute inset-x-0 top-0 h-28 w-full md:h-40" />
      <AuthWaves className="text-primary-foreground/10 absolute inset-x-0 bottom-0 h-28 w-full rotate-180 md:h-40" />

      <main className="relative flex flex-1 flex-col items-center justify-center gap-6 px-gutter pt-[max(4rem,env(safe-area-inset-top))] pb-[max(4rem,env(safe-area-inset-bottom))] md:py-16">
        <LogoWordmark className="w-40" />
        <div className="bg-background w-full max-w-sm rounded-2xl p-6 shadow-sm md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

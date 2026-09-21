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
 * Latar `bg-primary` di semua ukuran (keputusan user). Logo-nama user
 * berwarna terang dan dirancang untuk latar gelap, jadi logo selalu duduk di
 * atas navy — di luar kartu — dan tidak pernah di atas putih.
 *
 * - < lg : navy penuh, logo di atas, form di kartu putih (`max-w-sm` di md).
 * - ≥ lg : split-screen 45/55 — panel navy berisi logo + gelombang di kiri,
 *          form di kolom putih di kanan.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-primary relative flex min-h-dvh flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[45fr_55fr]">
      <div className="text-primary-foreground relative hidden items-center justify-center overflow-hidden lg:flex">
        <AuthWaves className="absolute inset-0 size-full opacity-15" />
        <LogoWordmark className="relative w-40" />
      </div>

      <AuthWaves className="text-primary-foreground/10 absolute inset-x-0 top-0 h-28 w-full md:h-40 lg:hidden" />
      <AuthWaves className="text-primary-foreground/10 absolute inset-x-0 bottom-0 h-28 w-full rotate-180 md:h-40 lg:hidden" />

      <main className="lg:bg-background relative flex flex-1 flex-col items-center justify-center gap-6 px-gutter pt-[max(4rem,env(safe-area-inset-top))] pb-[max(4rem,env(safe-area-inset-bottom))] md:py-16 lg:px-12">
        <LogoWordmark className="w-28 lg:hidden" />
        <div className="bg-background w-full max-w-sm rounded-2xl p-6 shadow-sm md:p-8 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
          {children}
        </div>
      </main>
    </div>
  );
}

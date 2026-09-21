import { AuthWaves } from "@/components/common/auth-waves";

/**
 * Kerangka halaman sebelum masuk, tanpa navigasi.
 *
 * Terpisah dari `(app)` karena app shell (bottom tab, header) tidak boleh
 * muncul di layar yang belum punya sesi — bukan cuma karena jelek, tapi
 * karena tab-tabnya menuju rute yang akan menendang balik ke sini.
 *
 * SELURUH keputusan responsif layar login dan `/authentication` hidup di
 * berkas ini (dikecualikan dari lint breakpoint untuk alasan itu). Halaman di
 * bawahnya bebas breakpoint dan cukup mengisi lebar yang diberikan:
 *
 * - < md  : full-bleed putih, gelombang di pojok atas dan bawah.
 * - md    : kartu putih `max-w-sm` di tengah latar `bg-muted`.
 * - ≥ lg  : split-screen 45/55 — panel navy dekoratif di kiri, form di kanan.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background md:bg-muted lg:bg-background relative flex min-h-dvh flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[45fr_55fr]">
      <div
        aria-hidden
        className="bg-primary text-primary-foreground relative hidden overflow-hidden lg:block"
      >
        <AuthWaves className="absolute inset-0 size-full opacity-15" />
      </div>

      <AuthWaves className="text-primary/10 absolute inset-x-0 top-0 h-28 w-full md:h-40 lg:hidden" />
      <AuthWaves className="text-primary/10 absolute inset-x-0 bottom-0 h-28 w-full rotate-180 md:h-40 lg:hidden" />

      <main className="relative flex flex-1 flex-col items-center justify-center px-gutter pt-[max(5rem,env(safe-area-inset-top))] pb-[max(5rem,env(safe-area-inset-bottom))] md:py-16 lg:px-12">
        <div className="w-full max-w-sm md:bg-background md:rounded-2xl md:p-8 md:shadow-sm lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * Kerangka halaman sebelum masuk: satu kolom di tengah, tanpa navigasi.
 *
 * Terpisah dari `(app)` karena app shell (bottom tab, header) tidak boleh
 * muncul di layar yang belum punya sesi — bukan cuma karena jelek, tapi
 * karena tab-tabnya menuju rute yang akan menendang balik ke sini.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      {children}
    </div>
  );
}

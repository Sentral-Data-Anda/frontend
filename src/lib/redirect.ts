/**
 * Tujuan setelah login hanya sah bila ia path di origin ini sendiri.
 *
 * Tanpa penjaga ini, `?redirect=https://phishing.test/login` akan melempar
 * user ke situs lain tepat sesudah ia berhasil masuk — halaman palsu yang
 * meminta password ulang, dari alamat yang tadinya sah. Ini kelas kerentanan
 * open redirect, dan satu-satunya obatnya adalah memeriksa nilainya, bukan
 * mempercayai dari mana ia datang.
 *
 * Yang ditolak: URL absolut (`https://…`), protocol-relative (`//…`), dan
 * akal-akalan backslash (`/\…`) yang masih diperlakukan sebagian browser
 * sebagai navigasi lintas-origin.
 */
export function isSafeRedirectPath(
  value: string | null | undefined,
): value is string {
  if (!value) return false;

  return (
    value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
  );
}

import { cn } from "@/lib/utils";

/**
 * Inisial nama di lingkaran 36px untuk baris daftar di atas kanvas
 * primary-50: lingkaran primary-200 (1.48:1 thd kanvas — primary-100 hanya
 * 1.14:1 dan hilang), huruf primary-900 (5.20:1). Penanda pengguna di header
 * Beranda memakai logo aplikasi (`LogoMark`), bukan avatar.
 *
 * Satu huruf, bukan dua. Nama jemaat lazim berupa nama lengkap tiga kata
 * ("Andreas Sitanggang Pardede"), dan dua huruf pada lingkaran 36px membuat
 * hurufnya mengecil sampai tidak terbaca.
 *
 * `aria-hidden`: nama lengkapnya selalu tertulis di sebelahnya, jadi inisial
 * hanya akan dibacakan dua kali.
 */
export function Avatar({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        "bg-primary-200 text-body font-semibold text-primary-900",
      )}
    >
      {label.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

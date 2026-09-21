import { cn } from "@/lib/utils";

/**
 * Inisial nama, 36px.
 *
 * - `solid` (bawaan): kotak navy bersudut kontrol 8px — satu avatar penanda
 *   pengguna di header Beranda.
 * - `soft`: lingkaran primary-100, huruf primary-900 (6.74:1) — baris daftar.
 *   Sepuluh kotak navy berjejer terlalu berat; yang dicari di daftar adalah
 *   namanya, bukan inisialnya.
 *
 * Satu huruf, bukan dua. Nama jemaat lazim berupa nama lengkap tiga kata
 * ("Andreas Sitanggang Pardede"), dan dua huruf pada kotak 36px membuat
 * hurufnya mengecil sampai tidak terbaca.
 *
 * `aria-hidden`: nama lengkapnya selalu tertulis di sebelahnya, jadi inisial
 * hanya akan dibacakan dua kali.
 */
export function Avatar({
  label,
  tone = "solid",
}: {
  label: string;
  tone?: "solid" | "soft";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center text-body font-semibold",
        tone === "solid"
          ? "bg-primary text-primary-foreground rounded-control"
          : "bg-primary-100 text-primary-900 rounded-full",
      )}
    >
      {label.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

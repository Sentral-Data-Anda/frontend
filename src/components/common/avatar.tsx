/**
 * Inisial nama di kotak navy, 36px — setinggi kontrol, jadi sudutnya pun
 * sudut kontrol (8px).
 *
 * Satu huruf, bukan dua. Nama jemaat lazim berupa nama lengkap tiga kata
 * ("Andreas Sitanggang Pardede"), dan dua huruf pada kotak 36px membuat
 * hurufnya mengecil sampai tidak terbaca.
 *
 * `aria-hidden`: nama lengkapnya selalu tertulis di sebelahnya, jadi inisial
 * hanya akan dibacakan dua kali.
 */
export function Avatar({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-control text-body font-semibold"
    >
      {label.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

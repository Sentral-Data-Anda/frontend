import type { ReactNode } from "react";

/**
 * Baris alat di atas daftar: pencarian lalu filter.
 *
 * Bertumpuk di kolom sempit (HP), satu baris begitu isinya ≥ 36rem (576px) —
 * container query, jadi tablet 672px dan desktop sama-sama satu baris tanpa
 * layar menulis breakpoint. Kotak cari dipatok 20rem di baris itu: cukup
 * untuk placeholder "Cari nama, kode, atau telepon", dan tidak melar sampai
 * chip filter terdorong ke ujung kanan tabel.
 */
export function ListToolbar({
  search,
  filters,
}: {
  search: ReactNode;
  filters?: ReactNode;
}) {
  return (
    <div className="@container px-gutter pb-4">
      <div className="flex flex-col gap-3 @min-[36rem]:flex-row @min-[36rem]:items-center">
        <div className="@min-[36rem]:w-80 @min-[36rem]:shrink-0">{search}</div>

        {filters}
      </div>
    </div>
  );
}

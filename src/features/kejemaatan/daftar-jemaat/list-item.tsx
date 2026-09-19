import { DataListRow } from "@/components/common/data-list";
import { Badge } from "@/components/ui/badge";

import {
  STATUS_JEMAAT_LABEL,
  TYPE_JEMAAT_LABEL,
  type JemaatListItem,
} from "./types";

/**
 * Inisial nama untuk avatar.
 *
 * Satu huruf, bukan dua. Nama jemaat di sini lazim berupa nama lengkap tiga
 * kata ("Andreas Sitanggang Pardede"), dan dua huruf pada lingkaran 36px
 * membuat hurufnya mengecil sampai tidak terbaca justru pada layar yang paling
 * banyak dipakai.
 */
const onPickInitial = (name: string): string =>
  name.trim().charAt(0).toUpperCase() || "?";

/**
 * Satu baris Daftar Jemaat.
 *
 * Baris kedua menggabungkan kode dan tipe dengan pemisah titik tengah, bukan
 * dua kolom terpisah: pada 390px kolom kedua yang sejajar akan menyisakan
 * ruang untuk nama kurang dari setengah layar. Nama adalah yang dicari orang,
 * jadi nama yang mendapat sisa ruangnya.
 *
 * Keluarga ikut ditampilkan bila ada — dua jemaat bernama sama dibedakan oleh
 * keluarganya, dan itulah pertanyaan pertama yang muncul saat melihat daftar.
 */
export function JemaatListItemRow({ jemaat }: { jemaat: JemaatListItem }) {
  const meta = [
    jemaat.code,
    TYPE_JEMAAT_LABEL[jemaat.type],
    jemaat.keluarga?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <DataListRow
      leading={
        <span
          aria-hidden
          className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-medium"
        >
          {onPickInitial(jemaat.name)}
        </span>
      }
      title={jemaat.name}
      meta={meta}
      trailing={
        <Badge variant={jemaat.status === "AKTIF" ? "secondary" : "outline"}>
          {STATUS_JEMAAT_LABEL[jemaat.status]}
        </Badge>
      }
    />
  );
}

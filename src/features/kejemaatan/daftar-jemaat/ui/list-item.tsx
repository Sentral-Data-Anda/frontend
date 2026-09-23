import { Avatar } from "@/components/common/avatar";
import { DataListRow } from "@/components/common/data-list";
import { Badge } from "@/components/ui/badge";

import {
  STATUS_JEMAAT_LABEL,
  TYPE_JEMAAT_LABEL,
  type JemaatListItem,
} from "../types";

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
      // `code`, bukan `publicId`: daftar be-sada tidak mengirim `publicId`,
      // dan `code` sudah unik. Ini yang membuat baris yang baru disimpan
      // tersorot saat form mengembalikan petugas ke sini.
      id={jemaat.code}
      leading={<Avatar label={jemaat.name} />}
      title={jemaat.name}
      meta={meta}
      trailing={
        <Badge variant={jemaat.status === "AKTIF" ? "success" : "neutral"}>
          {STATUS_JEMAAT_LABEL[jemaat.status]}
        </Badge>
      }
    />
  );
}

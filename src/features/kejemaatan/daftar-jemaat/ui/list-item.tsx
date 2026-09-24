import { Pencil } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/common/avatar";
import { buttonVariants } from "@/components/common/button";
import { DataListRow } from "@/components/common/data-list";
import type { DataTableConfig } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { JEMAAT_LIST_PATH } from "../model";
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
export function JemaatListItemRow({
  jemaat,
  isCanUpdate = false,
}: {
  jemaat: JemaatListItem;
  /** Menyalin guard endpoint `DAFTAR_JEMAAT` UPDATE — tampilan, bukan pengaman. */
  isCanUpdate?: boolean;
}) {
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
        <>
          <JemaatStatus status={jemaat.status} />

          {isCanUpdate ? (
            // `<Link>` bergaya tombol, BUKAN `Button` ber-`render`: aksi ini
            // adalah perpindahan halaman, dan Base UI memasang `role="button"`
            // pada elemen yang dirender — yang menghapus semantik tautan
            // beserta klik-tengah dan "buka di tab baru".
            //
            // Menandai baris SEBELUM pergi, bukan sesudah kembali: saat
            // kembali, layar ini dirender ulang dari cache dan tidak lagi
            // tahu baris mana yang dibuka.
            <Link
              href={editHref(MENU.KEJEMAATAN, MENU.DAFTAR_JEMAAT, jemaat.code)}
              onClick={() => saveListFocus(JEMAAT_LIST_PATH, jemaat.code)}
              aria-label={`Ubah ${jemaat.name}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "cursor-pointer",
              )}
            >
              <Pencil aria-hidden />
            </Link>
          ) : null}
        </>
      }
    />
  );
}

/** Nama relasi, atau "—" dengan teks pembaca layar bila kosong. */
function OptionalName({ name, empty }: { name?: string; empty: string }) {
  return name ? (
    <span className="block truncate" title={name}>
      {name}
    </span>
  ) : (
    <span className="text-muted-foreground">
      <span aria-hidden>—</span>
      <span className="sr-only">{empty}</span>
    </span>
  );
}

function JemaatStatus({ status }: { status: JemaatListItem["status"] }) {
  return (
    <Badge variant={status === "AKTIF" ? "success" : "neutral"}>
      {STATUS_JEMAAT_LABEL[status]}
    </Badge>
  );
}

/**
 * Daftar Jemaat sebagai tabel (tablet ke atas). Kolom = field yang memang
 * dikirim `GET /jemaat` (lihat `JemaatListItem`). Tipe dan Keluarga kolom
 * pelengkap: disembunyikan di tabel sempit (tablet, 1024 bersidebar penuh),
 * supaya Nama, Kode, Wilayah, dan Status tidak terpotong.
 *
 * Seluruh baris membuka form ubah, sama dengan pensil di baris HP; pensilnya
 * tetap tampil sebagai penanda. Tanpa izin UPDATE baris tidak bisa dibuka.
 */
export function jemaatTable(
  isCanUpdate: boolean,
): DataTableConfig<JemaatListItem> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2.4fr)",
        cell: (jemaat) => (
          <span className="flex min-w-0 items-center gap-3">
            <Avatar label={jemaat.name} />
            <span className="truncate font-medium" title={jemaat.name}>
              {jemaat.name}
            </span>
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        cell: (jemaat) => <span className="tabular-nums">{jemaat.code}</span>,
      },
      {
        key: "type",
        header: "Tipe",
        width: "minmax(0,1fr)",
        isSecondary: true,
        cell: (jemaat) => TYPE_JEMAAT_LABEL[jemaat.type],
      },
      {
        key: "keluarga",
        header: "Keluarga",
        width: "minmax(0,1.6fr)",
        isSecondary: true,
        cell: (jemaat) => (
          <OptionalName name={jemaat.keluarga?.name} empty="Tanpa keluarga" />
        ),
      },
      {
        key: "zone",
        header: "Wilayah",
        width: "minmax(0,1.2fr)",
        cell: (jemaat) => (
          <OptionalName name={jemaat.zoneChurch?.name} empty="Tanpa wilayah" />
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        cell: (jemaat) => <JemaatStatus status={jemaat.status} />,
      },
    ],
    getRowHref: isCanUpdate
      ? (jemaat) => editHref(MENU.KEJEMAATAN, MENU.DAFTAR_JEMAAT, jemaat.code)
      : undefined,
    getRowLabel: (jemaat) => `Ubah ${jemaat.name}`,
    onRowOpen: (jemaat) => saveListFocus(JEMAAT_LIST_PATH, jemaat.code),
    rowIcon: <Pencil />,
  };
}

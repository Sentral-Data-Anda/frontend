"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";

import { formatDate } from "@/lib/format";

import { useJemaatDuplicates } from "../api";
import { findDuplicate, JEMAAT_LIST_PATH } from "../model";

/**
 * Peringatan kembaran, **tidak pernah menghalangi simpan**.
 *
 * Kembar identik itu nyata, dan nama umum dengan tanggal lahir yang sama juga
 * terjadi. Menolak simpan di sini berarti petugas yang benar tidak punya
 * jalan keluar sama sekali; yang dia butuhkan adalah tahu, lalu memutuskan.
 *
 * Tanpa endpoint baru: `GET /jemaat?filter=&limit=5` sudah mengembalikan nama
 * dan tanggal lahir tiap baris.
 */
export function DuplicateWarning({
  name,
  birthDate,
  ownCode,
}: {
  name: string;
  birthDate: string;
  /** Mode ubah: jemaat yang sedang diubah bukan kembarannya sendiri. */
  ownCode?: string;
}) {
  const candidates = useJemaatDuplicates(name, birthDate);
  const twin = findDuplicate(
    candidates.data ?? [],
    { name, birthDate },
    ownCode,
  );

  if (!twin) return null;

  return (
    <p
      // `status`, bukan `alert`: ini kabar yang boleh dibaca saat sempat,
      // bukan galat yang menuntut perhatian sekarang juga.
      role="status"
      className="border-warning bg-warning/10 flex items-start gap-2 rounded-control border p-3 text-body"
    >
      <TriangleAlert
        className="text-warning-foreground mt-0.5 size-4 shrink-0"
        aria-hidden
      />

      <span>
        Sudah ada jemaat bernama{" "}
        <strong className="font-medium">{twin.name}</strong> lahir{" "}
        {formatDate(twin.birthDate ?? "")} (
        <Link
          href={`${JEMAAT_LIST_PATH}?search=${encodeURIComponent(twin.code)}`}
          className="text-primary underline underline-offset-2 hover:no-underline"
        >
          {twin.code}
        </Link>
        ). Lanjut menyimpan bila ini memang orang yang berbeda.
      </span>
    </p>
  );
}

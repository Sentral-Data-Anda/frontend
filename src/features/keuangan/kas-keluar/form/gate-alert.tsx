"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { FormAlert } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { monthLabel } from "@/lib/date";

import { useGateCompliance } from "../api";
import { previousMonthOf, reportCreateHref, reportFilterHref } from "../model";

interface PropTypes {
  bapelId: string;
  bapelName: string;
  expenseDate: string;
}

// Peringatan saat draf, bukan kejutan saat Bayar — dan INDIKATOR, bukan
// penjaga: Simpan tetap aktif dalam setiap keadaan di bawah. Yang memblokir
// uang adalah server di `bayar`, dan FE tidak pernah memblokir sendiri.
export const GateAlert = (props: PropTypes) => {
  const { bapelId, bapelName, expenseDate } = props;

  const { isCanView } = useMenuAccess(MENU.BUDGET_REALIZATION);
  const { year, month } = previousMonthOf(expenseDate);
  const compliance = useGateCompliance(bapelId, year, month);
  const row = compliance.data;

  if (!row) return null;

  const label = monthLabel(`${year}-${String(month).padStart(2, "0")}`);

  if (row.waiver) {
    // Alasannya TIDAK dilewatkan ke `message` FormAlert: paragraf itu tidak
    // punya aturan pembungkus, jadi satu alasan 250 karakter tanpa spasi
    // melebarkan halaman 390 menjadi ~2000px (diukur: client 300, scroll 1953).
    // Teks pengguna yang tak terbatas panjangnya dirender di elemen sendiri
    // yang membungkus — dan tetap PENUH, tidak pernah dipotong.
    return (
      <div className="space-y-2">
        <FormAlert
          tone="info"
          title={`Pencairan ${bapelName} bulan ${label} dibebaskan oleh ${row.waiver.createdBy?.name ?? "bendahara"}.`}
          message="Laporan pemakaian bulan itu tidak lagi menahan pencairan ini."
        />

        <p className="text-body wrap-break-word">Alasan: {row.waiver.reason}</p>
      </div>
    );
  }

  // `NOT_DUE` = nol pencairan di M−1: tidak ada uang keluar, tidak ada yang
  // terutang. `APPROVED` = sudah beres. Keduanya lolos tanpa spanduk.
  if (row.state === "APPROVED" || row.state === "NOT_DUE") return null;

  const isMissing = row.state === "MISSING";

  return (
    <div className="space-y-2">
      <FormAlert
        tone="warning"
        title={
          isMissing
            ? `Laporan pemakaian budget ${bapelName} bulan ${label} belum dibuat.`
            : `Laporan pemakaian budget ${bapelName} bulan ${label} masih draf.`
        }
        message="Pencairan baru akan ditolak sampai laporan itu disetujui lengkap. Draf ini tetap bisa disimpan."
      />

      {isCanView ? (
        <Link
          href={
            isMissing
              ? reportCreateHref(Number(bapelId), year, month)
              : reportFilterHref(Number(bapelId), year, month)
          }
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {isMissing ? "Buat laporannya" : "Lihat laporannya"}
        </Link>
      ) : null}
    </div>
  );
};

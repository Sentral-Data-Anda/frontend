"use client";

import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard-card";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCell } from "@/components/common/kpi-strip";
import { MENU, menuHref } from "@/config/menu";
import { formatRupiahCompact } from "@/lib/format";

import { amountOf, useWaitingApprovals, type ApprovalItem } from "./api";
import { daysSince } from "./time";

const QUEUE_HREF = menuHref(MENU.PERSETUJUAN, MENU.PERMINTAAN_PERSETUJUAN);

/** `enum DocumentType` be-sada (`schema.prisma:1725-1745`). */
const DOCUMENT_LABEL: Record<string, string> = {
  PURCHASE_REQUEST: "Permintaan pembelian",
  PROGRAM: "Program",
  PROGRAM_MENDADAK: "Program mendadak",
  BUDGET_USAGE_REPORT: "Laporan pemakaian anggaran",
  CASH_EXPENSE: "Kas keluar",
  LEAVE_REQUEST: "Cuti",
  PAYROLL_RUN: "Penggajian",
  PURCHASE_RETURN: "Retur pembelian",
  LOAN_ROOM: "Peminjaman ruang",
};

/** Komisi dari langkah yang sedang menunggu (satu-satunya bapel di data). */
const bapelOf = (item: ApprovalItem) =>
  item.steps.find((step) => step.order === item.currentOrder)?.approverBapel
    ?.name;

const ageOf = (days: number) =>
  days === 0 ? "hari ini" : `${days} hari menunggu`;

/**
 * Menunggu tindakan saya — inbox persetujuan (`?menunggu=saya`). Pemegang
 * menu tanpa jabatan aktif mendapat daftar kosong: widget tetap tampil dengan
 * satu baris, tidak disembunyikan (dashboard-desktop.md §1.1).
 *
 * be-sada tidak mengirim nama pengaju maupun nomor dokumen asal — yang ada
 * jenis dokumen, nominal, komisi langkah aktif, dan tanggal diajukan.
 */
export function ApprovalsWidget() {
  const query = useWaitingApprovals();
  const items = query.data?.data ?? [];
  const now = new Date();

  return (
    <DashboardCard
      title="Menunggu tindakan saya"
      actionLabel="Buka antrean"
      actionHref={QUEUE_HREF}
      query={query}
      minHeight="min-h-36"
    >
      {items.length === 0 ? (
        <EmptyState isCompact title="Tidak ada yang menunggu" />
      ) : (
        <DashboardList label="Dokumen menunggu persetujuan">
          {items.map((item) => (
            <DashboardRow
              key={item.code}
              title={DOCUMENT_LABEL[item.documentType] ?? item.documentType}
              meta={[
                item.code,
                bapelOf(item),
                ageOf(daysSince(item.submittedAt, now)),
              ]
                .filter(Boolean)
                .join(" · ")}
              href={QUEUE_HREF}
              trailing={
                amountOf(item.amount) > 0
                  ? formatRupiahCompact(amountOf(item.amount))
                  : undefined
              }
            />
          ))}
        </DashboardList>
      )}
    </DashboardCard>
  );
}

export function KpiWaitingApprovals() {
  const query = useWaitingApprovals();

  return (
    <KpiCell
      label="Menunggu tanda tangan"
      value={`${query.data?.totalData ?? 0} dokumen`}
      isLoading={query.isPending}
    />
  );
}

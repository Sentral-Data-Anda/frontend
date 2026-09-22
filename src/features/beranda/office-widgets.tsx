"use client";

import {
  DashboardCard,
  DashboardEmpty,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard-card";
import { KpiCell } from "@/components/common/kpi-strip";
import { MENU, menuHref } from "@/config/menu";
import { formatRupiahCompact } from "@/lib/format";

import {
  amountOf,
  useBirthdays,
  useDraftCashExpenses,
  usePendingLoanRooms,
} from "./api";
import { addDaysKey, formatDayMonth, monthOf, toDateKey } from "./time";

const CASH_EXPENSE_HREF = menuHref(MENU.KEUANGAN, MENU.KAS_KELUAR);
const LOAN_ROOM_HREF = menuHref(MENU.FASILITAS, MENU.PEMINJAMAN_RUANG);
const REPORT_JEMAAT_HREF = menuHref(MENU.KEJEMAATAN, MENU.REPORT_JEMAAT);

/**
 * Perlu dibayar: kas keluar berstatus DRAFT (`KAS_KELUAR` VIEW). Bagian
 * faktur jatuh tempo belum dibangun — filter status/`dueDate` di
 * `/faktur-supplier` belum dipastikan (dashboard-desktop.md §4, "T-B").
 */
export function CashExpenseWidget() {
  const query = useDraftCashExpenses();
  const items = query.data?.data ?? [];
  const total = query.data?.totalData ?? 0;

  return (
    <DashboardCard
      title="Perlu dibayar"
      actionLabel={total > items.length ? `Semua (${total})` : "Kas keluar"}
      actionHref={CASH_EXPENSE_HREF}
      query={query}
      minHeight="min-h-36"
    >
      {items.length === 0 ? (
        <DashboardEmpty>
          Tidak ada kas keluar yang menunggu dibayar
        </DashboardEmpty>
      ) : (
        <DashboardList label="Kas keluar draf">
          {items.map((item) => (
            <DashboardRow
              key={item.code}
              title={item.description}
              meta={[item.code, item.bapel?.name ?? item.payee]
                .filter(Boolean)
                .join(" · ")}
              href={CASH_EXPENSE_HREF}
              trailing={formatRupiahCompact(amountOf(item.totalAmount))}
            />
          ))}
        </DashboardList>
      )}
    </DashboardCard>
  );
}

/** Bulan ini (WIB) untuk `/report/jemaat/birth/:month`. */
const useMonthBirthdays = () => useBirthdays(monthOf(new Date()));

/**
 * Ulang tahun anggota jemaat bulan ini (`REPORT_JEMAAT` VIEW). Hanya nama dan
 * tanggal — tanpa usia maupun tahun lahir (keputusan BA/TL, privasi), meski
 * be-sada mengirim `umur`.
 */
export function BirthdaysWidget() {
  const query = useMonthBirthdays();
  const items = query.data ?? [];

  return (
    <DashboardCard
      title="Ulang tahun bulan ini"
      actionLabel={items.length > 5 ? `Semua (${items.length})` : undefined}
      actionHref={items.length > 5 ? REPORT_JEMAAT_HREF : undefined}
      query={query}
      minHeight="min-h-36"
    >
      {items.length === 0 ? (
        <DashboardEmpty>Tidak ada yang berulang tahun bulan ini</DashboardEmpty>
      ) : (
        <DashboardList label="Ulang tahun bulan ini">
          {items.slice(0, 5).map((item) => (
            <DashboardRow
              key={`${item.name}-${item.birthDate}`}
              title={item.name}
              meta={formatDayMonth(item.birthDate)}
            />
          ))}
        </DashboardList>
      )}
    </DashboardCard>
  );
}

export function KpiBirthdays() {
  const query = useMonthBirthdays();

  return (
    <KpiCell
      label="Ulang tahun bulan ini"
      value={`${query.data?.length ?? 0} jemaat`}
      isLoading={query.isPending}
    />
  );
}

/** 30 hari ke depan (WIB). */
const usePendingLoans = () => {
  const today = toDateKey(new Date());
  return usePendingLoanRooms(today, addDaysKey(today, 30));
};

/** Peminjaman ruang menunggu persetujuan (`PEMINJAMAN_RUANG` VIEW). */
export function LoanRoomsWidget() {
  const query = usePendingLoans();
  const items = query.data ?? [];

  return (
    <DashboardCard
      title="Peminjaman ruang menunggu"
      actionLabel="Peminjaman"
      actionHref={LOAN_ROOM_HREF}
      query={query}
      minHeight="min-h-28"
    >
      {items.length === 0 ? (
        <DashboardEmpty>Tidak ada peminjaman yang menunggu</DashboardEmpty>
      ) : (
        <DashboardList label="Peminjaman menunggu">
          {items.slice(0, 4).map((item) => (
            <DashboardRow
              key={item.code}
              title={item.room.name}
              meta={`${item.purpose} · ${item.jemaat.name}`}
              href={LOAN_ROOM_HREF}
              trailing={`${formatDayMonth(item.date)} ${item.startTime}`}
            />
          ))}
        </DashboardList>
      )}
    </DashboardCard>
  );
}

export function KpiPendingLoans() {
  const query = usePendingLoans();

  return (
    <KpiCell
      label="Peminjaman menunggu"
      value={`${query.data?.length ?? 0} permintaan`}
      hint="30 hari ke depan"
      isLoading={query.isPending}
    />
  );
}

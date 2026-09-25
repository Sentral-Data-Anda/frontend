"use client";

import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard/dashboard-card";
import { KpiCell } from "@/components/common/dashboard/kpi-strip";
import { EmptyState } from "@/components/common/feedback/empty-state";
import { MENU, menuHref } from "@/config/menu";

import {
  useBirthdaysInRange,
  useJemaatStats,
  usePendingLoanRooms,
} from "../api";
import {
  addDaysKey,
  formatDayMonth,
  formatWeekdayShort,
  toDateKey,
  weekKeys,
} from "../model";

const LOAN_ROOM_HREF = menuHref(MENU.FASILITAS, MENU.PEMINJAMAN_RUANG);
const REPORT_JEMAAT_HREF = menuHref(MENU.KEJEMAATAN, MENU.REPORT_JEMAAT);

const useWeekBirthdays = () => {
  const days = weekKeys(new Date());
  return { days, query: useBirthdaysInRange(days) };
};

export function BirthdaysWidget() {
  const { days, query } = useWeekBirthdays();
  const items = query.data;

  return (
    <DashboardCard
      title="Ulang tahun minggu ini"
      actionLabel={items.length > 5 ? `Semua (${items.length})` : undefined}
      actionHref={items.length > 5 ? REPORT_JEMAAT_HREF : undefined}
      query={query}
      minHeight="min-h-32"
    >
      {items.length === 0 ? (
        <EmptyState
          isCompact
          title="Tidak ada yang berulang tahun minggu ini"
        />
      ) : (
        <DashboardList label="Ulang tahun minggu ini">
          {items.slice(0, 5).map((item) => {
            const day = days.find((key) => key.slice(5) === item.dayKey);
            return (
              <DashboardRow
                key={`${item.name}-${item.dayKey}`}
                title={item.name}
                trailing={
                  <span className="text-muted-foreground">
                    {day
                      ? `${formatWeekdayShort(day)} ${Number(day.slice(8, 10))}`
                      : formatDayMonth(item.birthDate)}
                  </span>
                }
              />
            );
          })}
        </DashboardList>
      )}
    </DashboardCard>
  );
}

export function KpiBirthdays() {
  const { query } = useWeekBirthdays();

  return (
    <KpiCell
      label="Ulang tahun"
      value={`${query.data.length}`}
      hint="minggu ini"
      isLoading={query.isPending}
      isError={query.error !== null}
    />
  );
}

export function KpiJemaatTotal() {
  const query = useJemaatStats();

  return (
    <KpiCell
      label="Jumlah jemaat"
      value={query.data?.total.toLocaleString("id-ID")}
      hint={
        query.data
          ? `Anggota ${query.data.member.toLocaleString("id-ID")}`
          : undefined
      }
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
}

const usePendingLoans = () => {
  const today = toDateKey(new Date());
  return usePendingLoanRooms(today, addDaysKey(today, 30));
};

export function LoanRoomsWidget() {
  const query = usePendingLoans();
  const items = query.data ?? [];

  return (
    <DashboardCard
      title="Peminjaman ruang"
      actionLabel="Peminjaman"
      actionHref={LOAN_ROOM_HREF}
      query={query}
      minHeight="min-h-28"
    >
      {items.length === 0 ? (
        <EmptyState
          isCompact
          title="Tidak ada peminjaman yang menunggu persetujuan"
        />
      ) : (
        <DashboardList label="Peminjaman menunggu">
          {items.slice(0, 4).map((item) => (
            <DashboardRow
              key={item.code}
              title={item.room.name}
              meta={`${item.purpose} · ${item.jemaat.name}`}
              href={LOAN_ROOM_HREF}
              trailing={`${formatDayMonth(item.date)} ${item.startTime.replace(":", ".")}`}
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
      value={`${query.data?.length ?? 0}`}
      hint="30 hari ke depan"
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
}

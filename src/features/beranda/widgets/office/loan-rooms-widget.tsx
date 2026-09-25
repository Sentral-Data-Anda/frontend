"use client";

import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";
import { MENU, menuHref } from "@/config/menu";

import { formatDayMonth } from "../../model";

import { usePendingLoans } from "./data";

const LOAN_ROOM_HREF = menuHref(MENU.FASILITAS, MENU.PEMINJAMAN_RUANG);

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

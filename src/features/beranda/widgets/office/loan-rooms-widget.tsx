import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";
import { MENU, menuHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatClock } from "@/lib/format";

import { formatDayMonth, formatWeekdayShort } from "../../model";

import { useUpcomingLoans } from "./data";

const LOAN_ROOM_HREF = menuHref(MENU.FASILITAS, MENU.PEMINJAMAN_RUANG);

export const LoanRoomsWidget = () => {
  const { query } = useUpcomingLoans();
  const access = useMenuAccess(MENU.PEMINJAMAN_RUANG);
  const items = query.data;

  return (
    <DashboardCard
      title="Peminjaman Ruangan"
      actionLabel={access.isCanView ? "Semua" : undefined}
      actionHref={access.isCanView ? LOAN_ROOM_HREF : undefined}
      query={query}
      minHeight="min-h-28"
    >
      {items.length === 0 ? (
        <EmptyState
          isCompact
          title="Tidak ada peminjaman ruang 7 hari ke depan"
        />
      ) : (
        <DashboardList label="Peminjaman Ruangan">
          {items.slice(0, 4).map((item) => (
            <DashboardRow
              key={item.code}
              title={item.room.name}
              meta={`${item.purpose} · ${item.jemaat.name}`}
              href={access.isCanView ? LOAN_ROOM_HREF : undefined}
              trailing={`${formatWeekdayShort(item.date)} ${formatDayMonth(item.date)} ${formatClock(item.startTime)}`}
            />
          ))}
        </DashboardList>
      )}
    </DashboardCard>
  );
};

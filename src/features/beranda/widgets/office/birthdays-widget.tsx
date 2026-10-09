"use client";

import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";
import { MENU, menuHref } from "@/config/menu";

import { formatDayMonth, formatWeekdayShort } from "../../model";

import { useWeekBirthdays } from "./data";

const REPORT_JEMAAT_HREF = menuHref(MENU.REPORT, MENU.REPORT_JEMAAT);

export const BirthdaysWidget = () => {
  const { days, query } = useWeekBirthdays();
  const items = query.data;

  return (
    <DashboardCard
      title="Ulang Tahun"
      actionLabel={items.length > 5 ? "Semua" : undefined}
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
        <DashboardList label="Ulang Tahun">
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
};

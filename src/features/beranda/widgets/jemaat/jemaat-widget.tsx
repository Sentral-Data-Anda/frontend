"use client";

import { Tabs } from "@base-ui/react/tabs";

import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard";
import { Badge } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { MENU, menuHref } from "@/config/menu";

import { DUMMY_NEW_MEMBERS, SHOW_DUMMY } from "../../fixtures";
import { formatDayMonth, formatWeekdayShort } from "../../model";
import { useWeekBirthdays } from "../office/data";

const REPORT_JEMAAT_HREF = menuHref(MENU.REPORT, MENU.REPORT_JEMAAT);

const TAB =
  "text-muted-foreground hover:text-foreground data-active:bg-card data-active:text-foreground focus-visible:ring-ring flex h-7 items-center gap-2 rounded-control px-3 text-body font-medium transition-colors outline-none focus-visible:ring-2 data-active:shadow-sm";

type Birthday = ReturnType<typeof useWeekBirthdays>["query"]["data"][number];

const Birthdays = ({
  days,
  items,
}: {
  days: string[];
  items: readonly Birthday[];
}) => {
  if (items.length === 0)
    return (
      <EmptyState isCompact title="Tidak ada yang berulang tahun minggu ini" />
    );

  return (
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
  );
};

const NewMembers = () => (
  <DashboardList label="Jemaat baru bulan ini">
    {DUMMY_NEW_MEMBERS.map((member) => (
      <DashboardRow
        key={member.id}
        title={member.name}
        meta={member.note}
        trailing={formatDayMonth(member.date)}
      />
    ))}
  </DashboardList>
);

export const JemaatWidget = () => {
  const { days, query } = useWeekBirthdays();
  const birthdays = <Birthdays days={days} items={query.data} />;

  return (
    <DashboardCard
      title="Jemaat"
      actionLabel="Semua"
      actionHref={REPORT_JEMAAT_HREF}
      query={query}
      minHeight="min-h-32"
    >
      {SHOW_DUMMY ? (
        <Tabs.Root defaultValue="ulang-tahun">
          <Tabs.List className="bg-muted mb-2 inline-flex rounded-control p-0.5">
            <Tabs.Tab value="ulang-tahun" className={TAB}>
              Ulang Tahun
            </Tabs.Tab>
            <Tabs.Tab value="jemaat-baru" className={TAB}>
              Jemaat Baru
              <Badge variant="sample">contoh data</Badge>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="ulang-tahun">{birthdays}</Tabs.Panel>
          <Tabs.Panel value="jemaat-baru">
            <NewMembers />
          </Tabs.Panel>
        </Tabs.Root>
      ) : (
        birthdays
      )}
    </DashboardCard>
  );
};

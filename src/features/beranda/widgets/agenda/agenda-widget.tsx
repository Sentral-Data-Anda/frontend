"use client";

import { Tabs } from "@base-ui/react/tabs";
import { useState } from "react";

import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard";
import { TimeBadge } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { MENU, menuHref } from "@/config/menu";
import { cn } from "@/lib/utils";

import { sortByStartTime } from "../../api";
import {
  findNextService,
  formatDayMonth,
  formatWeekdayShort,
  toDateKey,
} from "../../model";

import { useWeekAgenda } from "./data";

const IBADAH_HREF = menuHref(MENU.PERIBADAHAN, MENU.IBADAH);

const EVENT_HREF = menuHref(MENU.KEGIATAN, MENU.EVENT);

const dayOf = (iso: string) => iso.slice(0, 10);

export const AgendaWidget = () => {
  const { now, days, ibadah, events, isEventShown } = useWeekAgenda();
  const [pickDay, setPickDay] = useState(days[0]);

  const ibadahOfDay = sortByStartTime(
    (ibadah.data ?? []).filter((item) => dayOf(item.date) === pickDay),
  );
  const next =
    pickDay === toDateKey(now) ? findNextService(ibadahOfDay, now) : undefined;
  const eventsOfDay = (events.data ?? []).filter(
    (item) =>
      dayOf(item.startDate) <= pickDay && pickDay <= dayOf(item.endDate),
  );

  const tabs = [
    ["ibadah", "Ibadah"],
    ...(isEventShown ? [["kegiatan", "Kegiatan"]] : []),
  ];

  const ibadahList =
    ibadahOfDay.length === 0 ? (
      <EmptyState isCompact title="Tidak ada ibadah" />
    ) : (
      <DashboardList label={`Ibadah ${formatDayMonth(pickDay)}`}>
        {ibadahOfDay.map((item) => (
          <DashboardRow
            key={item.code}
            leading={
              <TimeBadge time={item.startTime} highlighted={item === next} />
            }
            title={item.typeIbadah.name}
            meta={item.preacher ?? undefined}
            href={IBADAH_HREF}
          />
        ))}
      </DashboardList>
    );

  return (
    <DashboardCard
      title="Agenda"
      actionLabel="Kalender"
      actionHref={IBADAH_HREF}
      query={{
        isPending: ibadah.isPending || (isEventShown && events.isPending),
        isFetching: ibadah.isFetching || events.isFetching,
        error: ibadah.error ?? events.error,
        refetch: () => {
          void ibadah.refetch();
          if (isEventShown) void events.refetch();
        },
      }}
      minHeight="min-h-40"
    >
      <div
        role="group"
        aria-label="Pilih hari"
        className="mb-3 grid grid-cols-7 gap-1"
      >
        {days.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={key === pickDay}
            aria-label={formatDayMonth(key)}
            onClick={() => setPickDay(key)}
            className={cn(
              "flex h-12 flex-col items-center justify-center rounded-control text-caption transition-colors",
              "focus-visible:ring-ring outline-none focus-visible:ring-2",
              key === pickDay
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            <span aria-hidden>{formatWeekdayShort(key)}</span>
            <span aria-hidden className="text-body font-semibold tabular-nums">
              {Number(key.slice(8, 10))}
            </span>
          </button>
        ))}
      </div>

      {tabs.length > 1 ? (
        <Tabs.Root defaultValue="ibadah">
          <Tabs.List className="bg-muted mb-2 inline-flex rounded-control p-0.5">
            {tabs.map(([value, label]) => (
              <Tabs.Tab
                key={value}
                value={value}
                className="text-muted-foreground hover:text-foreground data-active:bg-card data-active:text-foreground focus-visible:ring-ring h-7 rounded-control px-3 text-body font-medium transition-colors outline-none focus-visible:ring-2 data-active:shadow-sm"
              >
                {label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          <Tabs.Panel value="ibadah">{ibadahList}</Tabs.Panel>
          <Tabs.Panel value="kegiatan">
            {eventsOfDay.length === 0 ? (
              <EmptyState isCompact title="Tidak ada kegiatan" />
            ) : (
              <DashboardList label={`Kegiatan ${formatDayMonth(pickDay)}`}>
                {eventsOfDay.map((item) => (
                  <DashboardRow
                    key={item.code}
                    title={item.name}
                    meta={[item.room?.name ?? item.location, item.bapel.name]
                      .filter(Boolean)
                      .join(" · ")}
                    href={EVENT_HREF}
                    trailing={
                      item.startDate === item.endDate
                        ? undefined
                        : `s.d. ${formatDayMonth(item.endDate)}`
                    }
                  />
                ))}
              </DashboardList>
            )}
          </Tabs.Panel>
        </Tabs.Root>
      ) : (
        ibadahList
      )}
    </DashboardCard>
  );
};

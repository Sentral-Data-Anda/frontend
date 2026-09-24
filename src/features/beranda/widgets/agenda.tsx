"use client";

import { Tabs } from "@base-ui/react/tabs";
import { useState } from "react";

import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard/dashboard-card";
import { KpiCell } from "@/components/common/dashboard/kpi-strip";
import { TimeBadge } from "@/components/common/display/time-badge";
import { EmptyState } from "@/components/common/feedback/empty-state";
import { MENU, menuHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth/use-menu-access";
import { cn } from "@/lib/utils";

import { sortByStartTime, useEventRange, useIbadahRange } from "../api";
import {
  findNextService,
  formatDayMonth,
  formatWeekdayShort,
  toDateKey,
  weekKeys,
} from "../model";

const IBADAH_HREF = menuHref(MENU.PERIBADAHAN, MENU.IBADAH);
const EVENT_HREF = menuHref(MENU.KEGIATAN, MENU.EVENT);

/**
 * Tujuh hari mulai hari ini + data Ibadah (dan Kegiatan bila EVENT VIEW).
 * Satu sumber untuk widget Agenda dan KPI "Agenda minggu ini" — TanStack
 * Query men-dedupe, jadi satu permintaan per endpoint.
 */
function useWeekAgenda() {
  // ponytail: dihitung sekali per render; halaman yang dibiarkan terbuka
  // melewati tengah malam tetap menampilkan minggu kemarin sampai dimuat ulang.
  const now = new Date();
  const days = weekKeys(now);
  const eventAccess = useMenuAccess(MENU.EVENT);
  const ibadah = useIbadahRange(days[0], days[6]);
  const events = useEventRange(days[0], days[6], eventAccess.isCanView);

  return { now, days, ibadah, events, isEventShown: eventAccess.isCanView };
}

const dayOf = (iso: string) => iso.slice(0, 10);

/**
 * Agenda ringkas (dashboard bendahara, §10.3 "Agenda bila IBADAH"): strip 7
 * hari + tab Ibadah / Kegiatan — tab Kegiatan hanya bila EVENT VIEW; gate
 * widget = IBADAH VIEW di registry. Hari pertama = hari ini; ibadah berikutnya hari ini
 * diberi kotak jam berlatar, seperti "Hari ini" sebelumnya.
 */
export function AgendaWidget() {
  const { now, days, ibadah, events, isEventShown } = useWeekAgenda();
  const [day, setDay] = useState(days[0]);

  const ibadahOfDay = sortByStartTime(
    (ibadah.data ?? []).filter((item) => dayOf(item.date) === day),
  );
  const next =
    day === toDateKey(now) ? findNextService(ibadahOfDay, now) : undefined;
  const eventsOfDay = (events.data ?? []).filter(
    (item) => dayOf(item.startDate) <= day && day <= dayOf(item.endDate),
  );

  const tabs = [
    ["ibadah", "Ibadah"],
    ...(isEventShown ? [["kegiatan", "Kegiatan"]] : []),
  ];

  const ibadahList =
    ibadahOfDay.length === 0 ? (
      <EmptyState isCompact title="Tidak ada ibadah" />
    ) : (
      <DashboardList label={`Ibadah ${formatDayMonth(day)}`}>
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
      // Satu kerangka untuk seluruh panel sampai ibadah DAN kegiatan tiba —
      // bukan teks "Memuat…" di dalam tab.
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
            aria-pressed={key === day}
            aria-label={formatDayMonth(key)}
            onClick={() => setDay(key)}
            className={cn(
              "flex h-12 flex-col items-center justify-center rounded-control text-caption transition-colors",
              "focus-visible:ring-ring outline-none focus-visible:ring-2",
              key === day
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
              <DashboardList label={`Kegiatan ${formatDayMonth(day)}`}>
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
}

/** KPI "Agenda minggu ini": ibadah + kegiatan (bila diizinkan), 7 hari. */
export function KpiAgendaWeek() {
  const { ibadah, events, isEventShown } = useWeekAgenda();
  const isLoading = ibadah.isPending || (isEventShown && events.isPending);
  const count = (ibadah.data?.length ?? 0) + (events.data?.length ?? 0);

  return (
    <KpiCell
      label="Agenda minggu ini"
      value={`${count} acara`}
      hint={isEventShown ? "Ibadah & kegiatan" : "Ibadah"}
      isLoading={isLoading}
    />
  );
}

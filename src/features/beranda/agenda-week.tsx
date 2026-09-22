"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { DashboardCard } from "@/components/common/dashboard-card";
import {
  DashboardTable,
  TableTitle,
  type TableRow,
} from "@/components/common/dashboard-table";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCell } from "@/components/common/kpi-strip";
import { MENU, menuHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth/use-menu-access";

import {
  sortByStartTime,
  useEventRange,
  useIbadahRange,
  type EventItem,
  type IbadahWeekItem,
} from "./api";
import {
  addDaysKey,
  formatDayMonth,
  formatWeekdayShort,
  toDateKey,
  weekKeys,
} from "./time";

const IBADAH_HREF = menuHref(MENU.PERIBADAHAN, MENU.IBADAH);
const EVENT_HREF = menuHref(MENU.KEGIATAN, MENU.EVENT);

const dayOf = (iso: string) => iso.slice(0, 10);

/** Satu acara di tabel Agenda: ibadah atau kegiatan. */
type AgendaItem = {
  key: string;
  day: string;
  /** "HH:mm" atau null (kegiatan be-sada hanya bertanggal). */
  time: string | null;
  name: string;
  room: string;
  href: string;
  /** Kegiatan berhari-hari: tanggal terakhirnya. */
  until?: string;
};

/** Ibadah + kegiatan pada satu rentang, urut hari lalu jam. */
export function buildAgenda(
  ibadah: IbadahWeekItem[],
  events: EventItem[],
  days: string[],
): AgendaItem[] {
  const rows: AgendaItem[] = [
    ...sortByStartTime(ibadah).map((item) => ({
      key: `ibadah-${item.code}`,
      day: dayOf(item.date),
      time: item.startTime,
      name: item.typeIbadah.name,
      room: item.room?.name ?? "—",
      href: IBADAH_HREF,
    })),
    // Satu baris per kegiatan (hari pertamanya di dalam rentang), bukan satu
    // baris per hari: kegiatan berhari-hari tidak mengulang dirinya.
    ...events.flatMap((item) => {
      const first = days.find(
        (day) => dayOf(item.startDate) <= day && day <= dayOf(item.endDate),
      );
      return first
        ? [
            {
              key: `event-${item.code}`,
              day: first,
              time: null,
              name: item.name,
              room: item.room?.name ?? item.location ?? "—",
              href: EVENT_HREF,
              until:
                dayOf(item.endDate) > first ? dayOf(item.endDate) : undefined,
            },
          ]
        : [];
    }),
  ];

  return rows.sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      (a.time ?? "99").localeCompare(b.time ?? "99"),
  );
}

const COLUMNS = [
  { label: "Hari", width: "0.8fr" },
  { label: "Jam", width: "0.6fr" },
  { label: "Acara", width: "2fr" },
  { label: "Ruang", width: "1.2fr", align: "right" as const },
];

/**
 * Agenda minggu ini (§10.4): tabel ibadah + kegiatan tujuh hari, dengan
 * navigasi minggu. Kolom PETUGAS di mockup belum dibangun — definisi "slot
 * pelayan kosong" di be-sada belum ada (lihat README "badge 1 kosong").
 */
export function AgendaWeekWidget() {
  const [offset, setOffset] = useState(0);
  // ponytail: dihitung sekali per render (WIB).
  const today = toDateKey(new Date());
  const start = addDaysKey(today, offset * 7);
  const days = weekKeys(new Date(`${start}T00:00:00Z`));
  const isEventShown = useMenuAccess(MENU.EVENT).isCanView;
  const ibadah = useIbadahRange(days[0], days[6]);
  const events = useEventRange(days[0], days[6], isEventShown);

  const rows = buildAgenda(ibadah.data ?? [], events.data ?? [], days);
  const tableRows: TableRow[] = rows.map((row) => ({
    key: row.key,
    href: row.href,
    label: row.name,
    cells: [
      <span key="day" className="text-muted-foreground truncate">
        {formatWeekdayShort(row.day)} {Number(row.day.slice(8, 10))}
      </span>,
      <span key="time" className="text-muted-foreground truncate">
        {row.time ? row.time.replace(":", ".") : "—"}
      </span>,
      <TableTitle
        key="name"
        title={row.name}
        meta={row.until ? `s.d. ${formatDayMonth(row.until)}` : undefined}
      />,
      <span key="room" className="text-muted-foreground truncate">
        {row.room}
      </span>,
    ],
    compact: {
      title: row.name,
      meta: (
        <span className="truncate">
          {formatWeekdayShort(row.day)} {formatDayMonth(row.day)} ·{" "}
          {row.time ? row.time.replace(":", ".") : "sepanjang hari"} ·{" "}
          {row.room}
        </span>
      ),
    },
  }));

  return (
    <DashboardCard
      title={offset === 0 ? "Agenda minggu ini" : "Agenda"}
      query={{
        isPending: ibadah.isPending || (isEventShown && events.isPending),
        isFetching: ibadah.isFetching || events.isFetching,
        error: ibadah.error ?? events.error,
        refetch: () => {
          void ibadah.refetch();
          if (isEventShown) void events.refetch();
        },
      }}
      minHeight="min-h-48"
      trailing={
        <span className="flex items-center gap-1">
          <span className="text-muted-foreground text-body tabular-nums">
            {formatDayMonth(days[0])} – {formatDayMonth(days[6])}
          </span>
          {(
            [
              ["Minggu sebelumnya", -1, ChevronLeft],
              ["Minggu berikutnya", 1, ChevronRight],
            ] as const
          ).map(([label, step, Icon]) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={() => setOffset((value) => value + step)}
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex size-6 items-center justify-center rounded-control transition-colors outline-none focus-visible:ring-2"
            >
              <Icon className="size-3.5" aria-hidden />
            </button>
          ))}
        </span>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          isCompact
          title="Tidak ada ibadah atau kegiatan minggu ini"
        />
      ) : (
        <DashboardTable
          label="Agenda minggu ini"
          columns={COLUMNS}
          rows={tableRows}
        />
      )}
    </DashboardCard>
  );
}

/** KPI "Ibadah · minggu ini". Keterangan petugas kosong: lihat catatan di atas. */
export function KpiServicesWeek() {
  // ponytail: dihitung sekali per render (WIB).
  const days = weekKeys(new Date());
  const ibadah = useIbadahRange(days[0], days[6]);

  return (
    <KpiCell
      label="Ibadah · minggu ini"
      value={`${ibadah.data?.length ?? 0}`}
      isLoading={ibadah.isPending}
      isError={ibadah.isError}
    />
  );
}

/** KPI "Kegiatan · 14 hari" (§10.4). */
export function KpiEventsFortnight() {
  // ponytail: dihitung sekali per render (WIB).
  const today = toDateKey(new Date());
  const events = useEventRange(today, addDaysKey(today, 13), true);
  const todayCount = (events.data ?? []).filter(
    (item) => dayOf(item.startDate) <= today && today <= dayOf(item.endDate),
  ).length;

  return (
    <KpiCell
      label="Kegiatan · 14 hari"
      value={`${events.data?.length ?? 0}`}
      hint={todayCount > 0 ? `${todayCount} hari ini` : undefined}
      isLoading={events.isPending}
      isError={events.isError}
    />
  );
}

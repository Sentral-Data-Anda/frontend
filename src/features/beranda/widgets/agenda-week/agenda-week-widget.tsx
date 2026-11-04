"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import {
  DashboardCard,
  DashboardTable,
  TableTitle,
  type TableRow,
} from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { useDashboardUmum } from "../../api";
import {
  addDaysKey,
  formatDayMonth,
  formatWeekdayShort,
  toDateKey,
  weekKeys,
} from "../../model";

import { buildAgenda } from "./data";

const COLUMNS = [
  { label: "Hari", width: "0.8fr" },
  { label: "Jam", width: "0.6fr" },
  { label: "Acara", width: "2fr" },
  { label: "Tempat", width: "1.2fr", align: "right" as const },
];

export const AgendaWeekWidget = () => {
  const [offset, setOffset] = useState(0);
  const today = toDateKey(new Date());
  const start = addDaysKey(today, offset * 7);
  const days = weekKeys(new Date(`${start}T00:00:00Z`));
  const isIbadahLinked = useMenuAccess(MENU.IBADAH).isCanView;
  const isEventLinked = useMenuAccess(MENU.EVENT).isCanView;
  const agenda = useDashboardUmum(days[0], days[6]);

  const rows = buildAgenda(
    agenda.data?.ibadah ?? [],
    agenda.data?.events ?? [],
    days,
  );

  const tableRows: TableRow[] = rows.map((row) => {
    const canOpen = row.key.startsWith("event-")
      ? isEventLinked
      : isIbadahLinked;

    return {
      key: row.key,
      href: canOpen ? row.href : undefined,
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
    };
  });

  return (
    <DashboardCard
      title="Agenda Mingguan"
      isScrollable
      query={agenda}
      isEmpty={rows.length === 0}
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
          label="Agenda Mingguan"
          columns={COLUMNS}
          rows={tableRows}
        />
      )}
    </DashboardCard>
  );
};

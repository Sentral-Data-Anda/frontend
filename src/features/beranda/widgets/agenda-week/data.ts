"use client";

import { MENU, menuHref } from "@/config/menu";

import {
  sortByStartTime,
  type EventItem,
  type IbadahWeekItem,
} from "../../api";

const IBADAH_HREF = menuHref(MENU.PERIBADAHAN, MENU.IBADAH);

const EVENT_HREF = menuHref(MENU.KEGIATAN, MENU.EVENT);

export const dayOf = (iso: string) => iso.slice(0, 10);

type AgendaItem = {
  key: string;
  day: string;
  time: string | null;
  name: string;
  room: string;
  href: string;
  until?: string;
};

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

"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchOne } from "@/lib/api/fetcher";

export type CalendarHoliday = {
  date: string;
  name: string;
  type: "NASIONAL" | "CUTI_BERSAMA" | "GEREJA";
};

export const HOLIDAY_CALENDAR_KEY = ["holiday-calendar"] as const;

const ONE_DAY_MS = 86_400_000;

const NO_HOLIDAYS = new Map<string, string>();

const namesByDate = (response: { data: CalendarHoliday[] }) => {
  const names = new Map<string, string>();

  for (const { date, name } of response.data) {
    const previous = names.get(date);
    names.set(date, previous ? `${previous}; ${name}` : name);
  }

  return names;
};

export function useHolidayCalendar(from: string, to: string) {
  const query = useQuery({
    queryKey: [...HOLIDAY_CALENDAR_KEY, from, to],
    queryFn: () =>
      fetchOne<CalendarHoliday[]>(`/hari-libur/kalender?from=${from}&to=${to}`),
    enabled: Boolean(from && to),
    staleTime: ONE_DAY_MS,
    retry: false,
    select: namesByDate,
  });

  return query.data ?? NO_HOLIDAYS;
}

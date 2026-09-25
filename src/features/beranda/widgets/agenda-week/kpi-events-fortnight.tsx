"use client";

import { KpiCell } from "@/components/common/dashboard";

import { useEventRange } from "../../api";
import { addDaysKey, toDateKey } from "../../model";

import { dayOf } from "./data";

export const KpiEventsFortnight = () => {
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
};

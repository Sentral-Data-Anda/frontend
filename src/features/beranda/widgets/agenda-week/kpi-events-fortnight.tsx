"use client";

import { CalendarHeart } from "lucide-react";

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
      label="Kegiatan"
      icon={CalendarHeart}
      tone="success"
      value={`${events.data?.length ?? 0}`}
      hint={
        todayCount > 0
          ? `14 hari ke depan, ${todayCount} hari ini`
          : "14 hari ke depan"
      }
      isLoading={events.isPending}
      isError={events.isError}
    />
  );
};

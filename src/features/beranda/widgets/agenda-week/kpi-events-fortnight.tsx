import { CalendarHeart } from "lucide-react";

import { KpiCell } from "@/components/common/dashboard";

import { useDashboardUmum } from "../../api";
import { addDaysKey, toDateKey } from "../../model";

import { dayOf } from "./data";

export const KpiEventsFortnight = () => {
  const today = toDateKey(new Date());
  const events = useDashboardUmum(today, addDaysKey(today, 13));
  const eventRows = events.data?.events ?? [];
  const todayCount = eventRows.filter(
    (item) => dayOf(item.startDate) <= today && today <= dayOf(item.endDate),
  ).length;

  return (
    <KpiCell
      label="Kegiatan"
      icon={CalendarHeart}
      tone="success"
      value={`${eventRows.length}`}
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

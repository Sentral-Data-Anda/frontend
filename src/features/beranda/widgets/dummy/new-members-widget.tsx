"use client";

import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard";

import { DUMMY_NEW_MEMBERS } from "../../fixtures";
import { formatDayMonth } from "../../model";

export function NewMembersWidget() {
  return (
    <DashboardCard title="Jemaat baru · bulan ini" isDummy>
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
    </DashboardCard>
  );
}

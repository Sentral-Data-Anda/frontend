"use client";

import { Inbox } from "lucide-react";

import { KpiCell } from "@/components/common/dashboard";
import { daysSince } from "@/lib/date";

import { useWaitingApprovals } from "../../api";

export const KpiWaitingApprovals = () => {
  const query = useWaitingApprovals();
  const items = query.data?.data ?? [];
  const oldest = items[0];

  return (
    <KpiCell
      label="Menunggu TTD"
      icon={Inbox}
      tone="warning"
      value={`${query.data?.totalData ?? 0}`}
      hint={
        oldest
          ? `tertua ${daysSince(oldest.submittedAt, new Date())} hari`
          : "tidak ada antrean"
      }
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
};

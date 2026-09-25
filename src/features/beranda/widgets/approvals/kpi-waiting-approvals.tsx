"use client";

import { KpiCell } from "@/components/common/dashboard";

import { useWaitingApprovals } from "../../api";
import { daysSince } from "../../model";

export function KpiWaitingApprovals() {
  const query = useWaitingApprovals();
  const items = query.data?.data ?? [];
  const oldest = items[0];

  return (
    <KpiCell
      label="Menunggu TTD"
      value={`${query.data?.totalData ?? 0}`}
      hint={
        oldest
          ? `tertua ${daysSince(oldest.submittedAt, new Date())} hari`
          : undefined
      }
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
}

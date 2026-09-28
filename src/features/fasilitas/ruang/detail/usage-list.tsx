"use client";

import { Button } from "@/components/common/control";
import { EmptyState } from "@/components/common/feedback";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { useRuangUsage } from "../api";
import { groupUsage, usageDayOf } from "../model";

import { UsageRow } from "./usage-row";

interface PropTypes {
  code: string;
}

export const UsageList = (props: PropTypes) => {
  const { code } = props;

  const usage = useRuangUsage(code);
  const { isCanUpdate: isCanUpdateLoan } = useMenuAccess(MENU.PEMINJAMAN_RUANG);
  const days = groupUsage(usage.data ?? []);

  if (usage.error && !usage.data) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 py-2">
        <p className="text-destructive text-body">
          Pemakaian ruang gagal dimuat.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={usage.isFetching}
          onClick={() => void usage.refetch()}
        >
          {usage.isFetching ? "Memuat…" : "Coba lagi"}
        </Button>
      </div>
    );
  }

  if (!usage.data) {
    return (
      <div role="status" aria-busy="true" className="space-y-3 py-2">
        {Array.from({ length: 3 }, (_, index) => (
          <span
            key={index}
            aria-hidden
            className="bg-skeleton block h-5 animate-pulse rounded-sm"
          />
        ))}
        <span className="sr-only">Memuat pemakaian ruang…</span>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <EmptyState title="Belum ada pemakaian 30 hari ke depan" isCompact />
    );
  }

  return (
    <div className="divide-hairline divide-y">
      {days.map((day) => (
        <section
          key={day.date}
          aria-label={usageDayOf(day.date)}
          className="py-2"
        >
          <h3 className="text-muted-foreground pt-1 text-caption font-medium">
            {usageDayOf(day.date)}
          </h3>
          <ul>
            {day.rows.map((row) => (
              <UsageRow
                key={`${row.kind}-${row.code}-${row.startTime}`}
                usage={row}
                isLinked={row.kind === "LOAN" && isCanUpdateLoan}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

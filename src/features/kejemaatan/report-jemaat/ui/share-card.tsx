"use client";

import type { UseQueryResult } from "@tanstack/react-query";

import { DashboardCard, ProgressBar } from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";

import { formatCount, formatShare, percentOf, totalOf } from "../model";
import type { Share } from "../types";

interface PropTypes {
  title: string;
  unit: string;
  emptyTitle: string;
  query: UseQueryResult<Share[]>;
}

export const ShareCard = (props: PropTypes) => {
  const { title, unit, emptyTitle, query } = props;

  const shares = query.data ?? [];
  const total = totalOf(shares);

  return (
    <DashboardCard
      title={title}
      query={query}
      minHeight="min-h-32"
      trailing={
        total > 0 ? (
          <span className="text-muted-foreground text-body tabular-nums">
            {formatCount(total)} {unit}
          </span>
        ) : null
      }
    >
      {total === 0 ? (
        <EmptyState isCompact title={emptyTitle} />
      ) : (
        <ul aria-label={title} className="space-y-3.5">
          {shares.map((share) => (
            <li key={share.key}>
              <ProgressBar
                label={share.label}
                value={percentOf(share.count, total)}
                meta={formatShare(share.count, total)}
              />
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
};

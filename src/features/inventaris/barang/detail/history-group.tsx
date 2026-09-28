"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

import { HISTORY_LIMIT, useAssetHistory } from "../api";
import { cycleListHref } from "../model";
import type { CycleKind } from "../types";

export type HistoryLine = { date: string; summary: string; note?: string };

interface PropTypes<T> {
  kind: CycleKind;
  assetId: number;
  code: string;
  title: string;
  emptyText: string;
  lineOf: (row: T) => HistoryLine;
}

export function HistoryGroup<T extends { code: string }>(props: PropTypes<T>) {
  const { kind, assetId, code, title, emptyText, lineOf } = props;

  const history = useAssetHistory<T>(kind, assetId);
  const rows = history.data?.data;
  const total = history.data?.totalData ?? 0;
  const headingId = `history-${kind}`;

  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <h3
        id={headingId}
        className="text-muted-foreground pb-1 text-caption font-medium"
      >
        {title}
      </h3>

      {history.error && !rows ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 py-2">
          <p className="text-destructive text-body">Riwayat gagal dimuat.</p>
          <Button
            type="button"
            variant="outline"
            disabled={history.isFetching}
            onClick={() => void history.refetch()}
          >
            {history.isFetching ? "Memuat…" : "Coba lagi"}
          </Button>
        </div>
      ) : !rows ? (
        <div role="status" aria-busy="true" className="space-y-3 py-2">
          {Array.from({ length: 2 }, (_, index) => (
            <span
              key={index}
              aria-hidden
              className="bg-skeleton block h-5 animate-pulse rounded-sm"
            />
          ))}
          <span className="sr-only">Memuat riwayat {title.toLowerCase()}…</span>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground py-2 text-body">{emptyText}</p>
      ) : (
        <>
          <ul className="divide-hairline divide-y">
            {rows.map((row) => {
              const line = lineOf(row);

              return (
                <li
                  key={row.code}
                  className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-x-3 py-2 text-body"
                >
                  <span className="text-muted-foreground tabular-nums">
                    {formatDateShort(line.date)}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 wrap-break-word">
                      {line.summary}
                    </span>
                    {line.note ? (
                      <span className="text-muted-foreground block text-caption">
                        {line.note}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
          {total > HISTORY_LIMIT ? (
            <Link
              href={cycleListHref(kind, code)}
              className={cn(
                buttonVariants({ variant: "link" }),
                "h-9 cursor-pointer px-0",
              )}
            >
              Lihat semua {total}
            </Link>
          ) : null}
        </>
      )}
    </section>
  );
}

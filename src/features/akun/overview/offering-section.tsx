"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Lock, LockOpen } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/common/control";
import { Panel } from "@/components/common/display";
import { DataList, DataListRow } from "@/components/common/list";
import { useBoolean } from "@/hooks/use-boolean";
import { todayJakarta } from "@/lib/date";
import { formatRupiah } from "@/lib/format";

import { offeringKeys, useMyOfferings } from "../api";
import { offeringMeta } from "../model";

const HISTORY_ID = "offering-history";

export const OfferingSection = () => {
  const queryClient = useQueryClient();
  const year = todayJakarta().slice(0, 4);
  const isShown = useBoolean();
  const offerings = useMyOfferings(year, isShown.value);
  const summary = offerings.data;
  const LockIcon = isShown.value ? LockOpen : Lock;
  const EyeIcon = isShown.value ? EyeOff : Eye;

  const onToggle = () => {
    if (!isShown.value) return isShown.onTrue();

    isShown.onFalse();
    queryClient.removeQueries({ queryKey: offeringKeys.mine(year) });
  };

  useEffect(() => {
    if (!isShown.value) return;

    const onVisibilityChange = () => {
      if (!document.hidden) return;

      isShown.onFalse();
      queryClient.removeQueries({ queryKey: offeringKeys.mine(year) });
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [isShown, queryClient, year]);

  return (
    <Panel label="Persembahan saya">
      <div className="flex items-center gap-3 px-gutter py-4">
        <LockIcon
          className="text-muted-foreground size-4 shrink-0"
          aria-hidden
        />

        <div className="min-w-0 flex-1">
          <p className="text-body font-medium">Persembahan {year}</p>
          {isShown.value && summary ? (
            <p className="text-muted-foreground text-caption tabular-nums">
              {summary.count} kali tercatat
            </p>
          ) : null}
        </div>

        {!isShown.value ? (
          <p className="text-body font-semibold">
            <span aria-hidden>
              Rp <span className="tracking-widest">•••••</span>
            </span>
            <span className="sr-only">Nominal disembunyikan</span>
          </p>
        ) : offerings.isPending ? (
          <span className="bg-skeleton block h-4 w-24 animate-pulse rounded" />
        ) : (
          <p className="text-body font-semibold tabular-nums">
            {summary ? formatRupiah(summary.total) : "—"}
          </p>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            isShown.value ? "Sembunyikan persembahan" : "Tampilkan persembahan"
          }
          aria-expanded={isShown.value}
          aria-controls={HISTORY_ID}
          onClick={onToggle}
        >
          <EyeIcon aria-hidden />
        </Button>
      </div>

      <div id={HISTORY_ID} className="border-hairline border-t empty:hidden">
        {isShown.value ? (
          <DataList
            items={summary?.items}
            getKey={(item) => item.code}
            label={`Riwayat persembahan ${year}`}
            isLoading={offerings.isPending}
            error={offerings.error}
            onRetry={() => void offerings.refetch()}
            emptyTitle={`Belum ada persembahan tercatat tahun ${year}`}
            emptyDescription="Persembahan yang dicatat bendahara muncul di sini."
            loadingShape="trailing"
          >
            {(item) => (
              <DataListRow
                id={item.code}
                title={item.typePersembahan.name}
                meta={offeringMeta(item)}
                trailing={
                  <span className="text-body font-medium tabular-nums">
                    {formatRupiah(Number(item.amount))}
                  </span>
                }
              />
            )}
          </DataList>
        ) : null}
      </div>
    </Panel>
  );
};

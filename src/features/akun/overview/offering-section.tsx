"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/common/control";
import { FormSection, FormWide } from "@/components/common/form";
import { DataList, DataListRow } from "@/components/common/list";
import { useBoolean } from "@/hooks/use-boolean";
import { todayJakarta } from "@/lib/date";
import { formatRupiah } from "@/lib/format";

import { offeringKeys, useMyOfferings } from "../api";
import { offeringMeta } from "../model";

import { OfferingVeil } from "./offering-veil";

const HISTORY_ID = "offering-history";

export const OfferingSection = () => {
  const queryClient = useQueryClient();
  const year = todayJakarta().slice(0, 4);
  const isShown = useBoolean();
  const offerings = useMyOfferings(year, isShown.value);
  const summary = offerings.data;

  const onHide = () => {
    isShown.onFalse();
    queryClient.removeQueries({ queryKey: offeringKeys.mine(year) });
  };

  const onToggle = () => {
    if (isShown.value) onHide();
    else isShown.onTrue();
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
    <FormSection
      isReadOnly
      legend="Persembahan saya"
      note="Tersembunyi sampai Anda menampilkannya, dan tertutup lagi setiap kali halaman ini ditinggalkan."
    >
      <FormWide>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-body">
              Total tahun {year}
            </p>

            {!isShown.value ? (
              <p className="text-kpi font-semibold">
                <span
                  aria-hidden
                  className="tracking-widest blur-[3px] select-none"
                >
                  Rp •••••
                </span>
                <span className="sr-only">Nominal disembunyikan</span>
              </p>
            ) : offerings.isPending ? (
              <span className="bg-muted block h-[1lh] w-32 animate-pulse rounded-control text-kpi" />
            ) : (
              <p className="text-kpi font-semibold tabular-nums">
                {summary ? formatRupiah(summary.total) : "—"}
              </p>
            )}

            <p className="text-muted-foreground text-caption tabular-nums">
              {isShown.value && summary
                ? `${summary.count} kali tercatat`
                : "Jumlah tercatat disembunyikan"}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            aria-expanded={isShown.value}
            aria-controls={HISTORY_ID}
            onClick={onToggle}
          >
            {isShown.value ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
            {isShown.value ? "Sembunyikan" : "Tampilkan"}
          </Button>
        </div>

        <div id={HISTORY_ID} className="mt-4">
          {isShown.value ? (
            <div className="-mx-gutter">
              <DataList
                items={summary?.items}
                getKey={(item) => item.code}
                label={`Riwayat persembahan ${year}`}
                isLoading={offerings.isPending}
                error={offerings.error}
                onRetry={() => void offerings.refetch()}
                emptyTitle={`Belum ada persembahan tercatat tahun ${year}`}
                emptyDescription="Persembahan yang dicatat bendahara muncul di sini."
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
            </div>
          ) : (
            <OfferingVeil />
          )}
        </div>
      </FormWide>
    </FormSection>
  );
};

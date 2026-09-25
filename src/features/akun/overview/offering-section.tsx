"use client";

import { useQueryClient } from "@tanstack/react-query";
import { EyeOff, Lock, LockOpen } from "lucide-react";
import { useEffect, useRef } from "react";

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
  const showRef = useRef<HTMLButtonElement>(null);
  const hideRef = useRef<HTMLButtonElement>(null);
  const isToggledRef = useRef(false);
  const LockIcon = isShown.value ? LockOpen : Lock;

  const onShow = () => {
    isToggledRef.current = true;
    isShown.onTrue();
  };

  const onHide = () => {
    isToggledRef.current = true;
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

  // Tombolnya berpindah tempat; fokus ikut agar keyboard tidak jatuh ke body.
  useEffect(() => {
    if (!isToggledRef.current) return;

    isToggledRef.current = false;
    (isShown.value ? hideRef : showRef).current?.focus();
  }, [isShown.value]);

  return (
    <FormSection
      isReadOnly
      legend="Persembahan saya"
      note="Tersembunyi sampai Anda menampilkannya, dan tertutup lagi setiap kali halaman ini ditinggalkan."
    >
      <FormWide>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground flex items-center gap-1.5 text-body">
              <LockIcon className="size-3.5 shrink-0" aria-hidden />
              Total tahun {year}
            </p>

            {!isShown.value ? (
              <p className="text-foreground text-kpi font-semibold">
                <span aria-hidden>
                  Rp <span className="tracking-widest">•••••</span>
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
              {!isShown.value
                ? "Jumlah tercatat disembunyikan"
                : summary
                  ? `${summary.count} kali tercatat`
                  : offerings.isError
                    ? "Ringkasan tidak tersedia"
                    : "Memuat…"}
            </p>
          </div>

          {isShown.value ? (
            <Button
              ref={hideRef}
              type="button"
              variant="outline"
              aria-expanded
              aria-controls={HISTORY_ID}
              onClick={onHide}
            >
              <EyeOff className="size-4" aria-hidden />
              Sembunyikan
            </Button>
          ) : null}
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
            </div>
          ) : (
            <OfferingVeil
              controlsId={HISTORY_ID}
              showRef={showRef}
              onShow={onShow}
            />
          )}
        </div>
      </FormWide>
    </FormSection>
  );
};

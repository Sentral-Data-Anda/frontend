"use client";

import { Eye, EyeOff, Lock, LockOpen } from "lucide-react";
import { useEffect, useEffectEvent } from "react";

import { Button } from "@/components/common/control";
import { Panel } from "@/components/common/display";
import { DataList, DataListRow } from "@/components/common/list";
import { useBoolean } from "@/hooks/use-boolean";
import { todayJakarta } from "@/lib/date";
import { formatRupiah } from "@/lib/format";

import { offeringKeys, useMyOfferings } from "../api";
import { isStepUpRequired, offeringMeta } from "../model";
import { useReveal } from "../use-reveal";
import { useStepUp } from "../use-step-up";

import { StepUpDialog } from "./step-up-dialog";

const HISTORY_ID = "offering-history";

export const OfferingSection = () => {
  const year = todayJakarta().slice(0, 4);
  const reveal = useReveal(offeringKeys.mine(year));
  const stepUp = useStepUp();
  const isAsking = useBoolean();
  const offerings = useMyOfferings(year, reveal.isShown);
  const isStepUpLost = isStepUpRequired(offerings.error);
  const isShown = reveal.isShown && !isStepUpLost;
  const summary = offerings.data;
  const LockIcon = isShown ? LockOpen : Lock;
  const EyeIcon = isShown ? EyeOff : Eye;

  const onToggle = () => {
    if (reveal.isShown) reveal.onHide();
    else if (stepUp.isActive()) reveal.onShow();
    else isAsking.onTrue();
  };

  const onVerified = (expiresAt: string) => {
    stepUp.onGrant(expiresAt);
    isAsking.onFalse();
    reveal.onShow();
  };

  const onStepUpLost = useEffectEvent(() => {
    stepUp.onForget();
    reveal.onHide();
    isAsking.onTrue();
  });

  useEffect(() => {
    if (isStepUpLost) onStepUpLost();
  }, [isStepUpLost]);

  return (
    <Panel label="Persembahan saya">
      <div className="flex items-center gap-3 px-gutter py-4">
        <LockIcon
          className="text-muted-foreground size-4 shrink-0"
          aria-hidden
        />

        <div className="min-w-0 flex-1">
          <p className="text-body font-medium">Persembahan {year}</p>
          {isShown && summary ? (
            <p className="text-muted-foreground text-caption tabular-nums">
              {summary.count} kali tercatat
            </p>
          ) : null}
        </div>

        {!isShown ? (
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
            isShown ? "Sembunyikan persembahan" : "Tampilkan persembahan"
          }
          aria-expanded={isShown}
          aria-controls={HISTORY_ID}
          onClick={onToggle}
        >
          <EyeIcon aria-hidden />
        </Button>
      </div>

      <div id={HISTORY_ID} className="border-hairline border-t empty:hidden">
        {isShown ? (
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
                  <span className="text-body font-semibold tabular-nums">
                    {formatRupiah(Number(item.amount))}
                  </span>
                }
              />
            )}
          </DataList>
        ) : null}
      </div>

      <StepUpDialog
        isOpen={isAsking.value}
        onClose={isAsking.onFalse}
        onVerified={onVerified}
      />
    </Panel>
  );
};

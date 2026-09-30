"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button, buttonVariants } from "@/components/common/control";
import { useToast } from "@/components/common/feedback";
import {
  FormActions,
  FormAlert,
  FormConfirmDialog,
  FormLayout,
  NoFormAccess,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { FetchError } from "@/lib/api/fetcher";
import { monthOptions, todayJakarta } from "@/lib/date";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { usePostPersembahan } from "../api";
import {
  JURNAL_LIST_PATH,
  NO_VIEW,
  POSTING_NOTE,
  postingStatusOf,
  RELOAD_ADVICE,
  isReloadAdvised,
  isSameRange,
  monthListHref,
  rangeOfMonth,
} from "../model";
import type { PostingRange, PostingResult } from "../types";
import { FixLink } from "../ui";

import { PreviewPanel } from "./preview-panel";
import { RangeSection } from "./range-section";
import { RefusedList } from "./refused-list";

const TITLE = "Posting Persembahan";

type Outcome = {
  range: PostingRange;
  result: PostingResult;
  isDone: boolean;
};

const postedTextOf = (result: PostingResult) =>
  `Pratinjau ini akan membukukan ${formatNumber(result.posted)} persembahan menjadi ${formatNumber(result.posted)} entri jurnal. ${formatNumber(result.skipped)} dilewati dan ${formatNumber(result.refused.length)} ditolak. Entri yang diposting tidak bisa diubah atau dihapus lagi — hanya dibalik.`;

export const PostingPersembahanScreen = () => {
  const toast = useToast();
  const { isCanView, isCanCreate } = useMenuAccess(MENU.JURNAL);
  const [bulan, setBulan] = useState(() => todayJakarta().slice(0, 7));
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const posting = usePostPersembahan();
  const confirm = useFormConfirm();
  const range = rangeOfMonth(bulan);
  const preview =
    outcome && !outcome.isDone && isSameRange(outcome.range, range)
      ? outcome
      : null;
  // Pratinjau yang menolak semuanya tidak boleh menyisakan tombol aktif: ia
  // hanya akan membukukan nol baris dan mengajari bendahara bahwa tombolnya
  // kadang tidak melakukan apa-apa.
  const isPostable =
    preview !== null && preview.result.posted > 0 && !posting.isPending;
  const failure = posting.error;
  const failureCode = failure instanceof FetchError ? failure.code : null;

  const onPickBulan = (next: string) => {
    setBulan(next);
    setOutcome(null);
    posting.reset();
  };

  const onRun = (isDryRun: boolean) => {
    if (!range) return;

    posting.mutate(
      { ...range, isDryRun },
      {
        onSuccess: (response) => {
          setOutcome({ range, result: response.data, isDone: !isDryRun });
          if (!isDryRun) toast.add({ title: response.message });
        },
      },
    );
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPostable) confirm.onOpen("save");
  };

  if (!isCanCreate) {
    return (
      <NoFormAccess
        title="Tidak bisa memposting persembahan"
        description={
          isCanView
            ? "Memposting persembahan menulis entri jurnal, jadi izinnya adalah izin membuat jurnal."
            : NO_VIEW
        }
        backHref={JURNAL_LIST_PATH}
        backLabel="Kembali ke Jurnal"
      />
    );
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions status={postingStatusOf(preview)}>
          <Link
            href={JURNAL_LIST_PATH}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "cursor-pointer",
            )}
          >
            Kembali
          </Link>

          <Button type="submit" disabled={!isPostable}>
            {posting.isPending && !posting.variables?.isDryRun
              ? "Memposting…"
              : "Posting"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={TITLE}
          backHref={JURNAL_LIST_PATH}
          isBackPersistent
        />
      }
    >
      <div className="space-y-4 px-gutter py-4">
        <p className="text-muted-foreground text-body">{POSTING_NOTE}</p>

        <RangeSection
          bulan={bulan}
          options={monthOptions()}
          isPending={posting.isPending}
          onPickBulan={onPickBulan}
          onPreview={() => onRun(true)}
        />

        {failure ? (
          <div className="flex flex-col items-start gap-2">
            <FormAlert
              title="Tidak ada yang dibukukan."
              message={
                isReloadAdvised(failure)
                  ? `${failure.message} ${RELOAD_ADVICE}`
                  : failure.message
              }
            />
            <FixLink code={failureCode} />
          </div>
        ) : null}

        {outcome ? (
          <PreviewPanel result={outcome.result} isDone={outcome.isDone} />
        ) : null}

        {outcome?.isDone && outcome.result.posted > 0 ? (
          <Link
            href={monthListHref(
              Number(outcome.range.from.slice(0, 4)),
              Number(outcome.range.from.slice(5, 7)),
            )}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "cursor-pointer",
            )}
          >
            Lihat entri yang baru dibuat
          </Link>
        ) : null}
      </div>

      {outcome ? <RefusedList refused={outcome.result.refused} /> : null}

      <FormConfirmDialog
        confirm={confirm}
        noun="posting persembahan"
        descriptions={
          preview ? { save: postedTextOf(preview.result) } : undefined
        }
        onSave={() => onRun(false)}
      />
    </FormLayout>
  );
};

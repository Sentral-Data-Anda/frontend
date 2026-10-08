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
  PreviewPanel,
  RangeSection,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { FetchError } from "@/lib/api/fetcher";
import { monthOptions, todayJakarta } from "@/lib/date";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { usePostPersediaan } from "../api";
import {
  JURNAL_LIST_PATH,
  NOTHING_TO_POST_PERSEDIAAN,
  NO_VIEW,
  POSTING_PERSEDIAAN_NOTE,
  barangPersediaanHref,
  isSameRange,
  postingStatusOf,
  rangeOfMonth,
} from "../model";
import type { PostingRange, PostingResult } from "../types";
import { FixLink } from "../ui";

import { RefusedList } from "./refused-list";

const TITLE = "Posting Mutasi Persediaan";

const NO_POSTING_ACCESS =
  "Peran Anda bisa melihat Jurnal, tetapi tidak membuat entri.";

type Outcome = {
  range: PostingRange;
  result: PostingResult;
  isDone: boolean;
};

const postedTextOf = (result: PostingResult) =>
  `Pratinjau ini akan membukukan ${formatNumber(result.posted)} mutasi menjadi ${formatNumber(result.posted)} entri jurnal. ${formatNumber(result.skipped)} dilewati dan ${formatNumber(result.refused.length)} ditolak. Entri yang diposting tidak bisa diubah atau dihapus lagi — hanya dibalik.`;

export const PostingPersediaanScreen = () => {
  const toast = useToast();
  const { isCanView, isCanCreate } = useMenuAccess(MENU.JURNAL);
  // Izin barang persediaan dihitung di sini, bukan di dalam RefusedList: hook
  // tidak bisa dipanggil bersyarat, dan yang ditolak di sini dijaga menu lain.
  const barangAccess = useMenuAccess(MENU.BARANG_PERSEDIAAN);
  const [bulan, setBulan] = useState(() => todayJakarta().slice(0, 7));
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const posting = usePostPersediaan();
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
        title="Tidak bisa memposting mutasi persediaan"
        description={isCanView ? NO_POSTING_ACCESS : NO_VIEW}
        backHref={JURNAL_LIST_PATH}
        backLabel="Kembali ke Jurnal"
      />
    );
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions
          status={postingStatusOf(preview, NOTHING_TO_POST_PERSEDIAAN)}
        >
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
        <p className="text-muted-foreground text-body">
          {POSTING_PERSEDIAAN_NOTE}
        </p>

        <RangeSection
          noun="mutasi"
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
              message={failure.message}
            />
            <FixLink code={failureCode} />
          </div>
        ) : null}

        {outcome ? (
          <PreviewPanel result={outcome.result} isDone={outcome.isDone} />
        ) : null}
      </div>

      {outcome ? (
        <RefusedList
          refused={outcome.result.refused}
          noun="Barang"
          hrefOf={(code) =>
            barangAccess.isCanView ? barangPersediaanHref(code) : null
          }
        />
      ) : null}

      <FormConfirmDialog
        confirm={confirm}
        noun="posting mutasi persediaan"
        descriptions={
          preview ? { save: postedTextOf(preview.result) } : undefined
        }
        onSave={() => onRun(false)}
      />
    </FormLayout>
  );
};

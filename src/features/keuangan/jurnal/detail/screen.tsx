"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/control";
import { DescriptionSkeleton, Panel } from "@/components/common/display";
import { EmptyState, useToast } from "@/components/common/feedback";
import {
  FormAlert,
  FormConfirmDialog,
  FormNotFound,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { formatDateShort } from "@/lib/format";

import {
  useDeleteJournal,
  useJournalDetail,
  usePostJournal,
  useReverseJournal,
} from "../api";
import {
  DELETE_TEXT,
  JURNAL_LIST_PATH,
  NO_VIEW,
  POST_TEXT,
  RELOAD_ADVICE,
  isReloadAdvised,
  journalHref,
} from "../model";
import type { ReversePayload } from "../types";
import { FixLink, JournalStatusBadge } from "../ui";

import { EntryActions, type EntryAction } from "./entry-actions";
import { LineList } from "./line-list";
import { ReverseDialog } from "./reverse-dialog";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Jurnal";

const FAILURE_TITLE: Record<EntryAction, string> = {
  posting: "Entri belum diposting.",
  balikkan: "Entri belum dibalik.",
  hapus: "Draf belum dihapus.",
};

interface PropTypes {
  publicId: string;
}

export const JournalDetailScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView } = useMenuAccess(MENU.JURNAL);
  const listReturn = useListReturn(JURNAL_LIST_PATH);
  const detail = useJournalDetail(isCanView ? publicId : undefined);
  const postJournal = usePostJournal(publicId);
  const reverseJournal = useReverseJournal(publicId);
  const deleteJournal = useDeleteJournal(publicId);
  const confirm = useFormConfirm();
  const isReverseOpen = useBoolean();
  const [pickAction, setPickAction] = useState<EntryAction>("posting");
  const entry = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const pendingAction: EntryAction | null = postJournal.isPending
    ? "posting"
    : reverseJournal.isPending
      ? "balikkan"
      : deleteJournal.isPending
        ? "hapus"
        : null;
  const failure =
    postJournal.error ?? reverseJournal.error ?? deleteJournal.error ?? null;
  const failureCode = failure instanceof FetchError ? failure.code : null;

  const onPick = (next: EntryAction) => {
    setPickAction(next);
    postJournal.reset();
    reverseJournal.reset();
    deleteJournal.reset();

    if (next === "balikkan") isReverseOpen.onTrue();
    else confirm.onOpen(next === "posting" ? "update" : "delete");
  };

  const onPost = () =>
    postJournal.mutate(undefined, {
      onSuccess: (response) => toast.add({ title: response.message }),
    });

  const onDelete = () =>
    deleteJournal.mutate(undefined, {
      onSuccess: (response) => {
        toast.add({ title: response.message });
        router.replace(listReturn);
      },
    });

  const onReverse = (payload: ReversePayload) =>
    reverseJournal.mutate(payload, {
      onSuccess: (response) => {
        toast.add({ title: response.message });
        isReverseOpen.onFalse();
        router.push(journalHref(response.data.publicId));
      },
    });

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.KEUANGAN)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Jurnal"
          description={`${NO_VIEW} Hubungi administrator bila Anda memang seharusnya memegangnya.`}
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="entri jurnal"
        backHref={listReturn}
        backLabel="Kembali ke Jurnal"
      />
    );
  }

  if (!entry) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat entri jurnal"
              description={detail.error.message}
              action={
                <Button
                  type="button"
                  variant="outline"
                  disabled={detail.isFetching}
                  onClick={() => void detail.refetch()}
                >
                  {detail.isFetching ? "Memuat…" : "Coba lagi"}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="px-gutter">
            <Panel>
              <div className="px-gutter py-2">
                <DescriptionSkeleton label="Memuat entri jurnal" rows={6} />
              </div>
            </Panel>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-8">
      <PageHeader
        title={entry.description}
        subtitle={`${entry.code} · ${formatDateShort(entry.entryDate)}`}
        backHref={listReturn}
        isBackPersistent
        action={
          <JournalStatusBadge
            status={entry.status}
            note={entry.isReversal ? "pembalik" : null}
          />
        }
      />

      <div className="space-y-4 px-gutter pb-4">
        <SummaryPanel entry={entry} />

        <EntryActions
          entry={entry}
          pendingAction={pendingAction}
          onPick={onPick}
        />

        {failure ? (
          <div className="flex flex-col items-start gap-2">
            <FormAlert
              title={FAILURE_TITLE[pickAction]}
              message={
                isReloadAdvised(failure)
                  ? `${failure.message} ${RELOAD_ADVICE}`
                  : failure.message
              }
            />
            <FixLink code={failureCode} />
          </div>
        ) : null}

        <h2 className="text-title pt-2 font-semibold">Baris</h2>
      </div>

      <LineList entry={entry} isRefreshing={detail.isFetching} />

      <FormConfirmDialog
        confirm={confirm}
        noun="entri jurnal"
        descriptions={{ update: POST_TEXT, delete: DELETE_TEXT }}
        onSave={onPost}
        onDelete={onDelete}
      />

      <ReverseDialog
        entry={entry}
        isOpen={isReverseOpen.value}
        isPending={reverseJournal.isPending}
        onOpenChange={isReverseOpen.setValue}
        onReverse={onReverse}
      />
    </div>
  );
};

"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

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
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";

import { useDeleteRun, useRunAction, useRunDetail } from "../api";
import {
  DELETE_TEXT,
  GAP_NOTE,
  PENYUSUTAN_LIST_PATH,
  actionErrorTitle,
  isCalculated,
  periodLabel,
  postText,
  recalculateText,
} from "../model";
import type { RunAction } from "../types";
import { RunStatus } from "../ui";

import { EntryList } from "./entry-list";
import { RunActions } from "./run-actions";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Penyusutan";

interface PropTypes {
  code: string;
}

export const PenyusutanDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.PENYUSUTAN,
  );
  const { isCanView: isCanViewAsset } = useMenuAccess(MENU.BARANG);
  const listReturn = useListReturn(PENYUSUTAN_LIST_PATH);
  const detail = useRunDetail(isCanView ? code : undefined);
  const runAction = useRunAction(code);
  const deleteRun = useDeleteRun(code);
  const confirm = useFormConfirm();
  const [pickAction, setPickAction] = useState<RunAction>("calculate");
  const run = detail.data;
  const period = run ? periodLabel(run.year, run.month) : "";
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const pendingAction = runAction.isPending
    ? (runAction.variables ?? null)
    : deleteRun.isPending
      ? "delete"
      : null;
  const failure = runAction.error ?? deleteRun.error;
  const failedAction = deleteRun.error
    ? "delete"
    : (runAction.variables ?? "calculate");

  const header = (title: string, subtitle?: string, action?: ReactNode) => (
    <PageHeader
      title={title}
      subtitle={subtitle}
      backHref={listReturn}
      isBackPersistent
      action={action}
    />
  );

  const onRun = (action: RunAction) => {
    deleteRun.reset();
    runAction.mutate(action, {
      onSuccess: (result) => toast.add({ title: result.message }),
    });
  };

  const onCalculate = () => {
    if (!run || !isCalculated(run)) return onRun("calculate");

    setPickAction("calculate");
    confirm.onOpen("update");
  };

  const onPost = () => {
    setPickAction("post");
    confirm.onOpen("update");
  };

  const onDelete = () => {
    runAction.reset();
    deleteRun.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.INVENTARIS)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Penyusutan"
          description="Hubungi administrator bila Anda memerlukan akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="periode penyusutan"
        backHref={listReturn}
        backLabel="Kembali ke Penyusutan"
      />
    );
  }

  if (!run) {
    return (
      <div className="pb-8">
        {header(TITLE)}

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat penyusutan"
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
                <DescriptionSkeleton label="Memuat penyusutan" rows={5} />
              </div>
            </Panel>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-8">
      {header(
        `${TITLE} ${period}`,
        run.code,
        <RunStatus run={run} isCompact />,
      )}

      <div className="space-y-4 px-gutter">
        {failure ? (
          <FormAlert
            title={actionErrorTitle(failedAction, failure.message)}
            message={failure.message}
          />
        ) : null}

        <SummaryPanel run={run} />

        <FormAlert
          tone="info"
          title={GAP_NOTE.title}
          message={GAP_NOTE.message}
        />
      </div>

      <RunActions
        run={run}
        isCanUpdate={isCanUpdate}
        isCanDelete={isCanDelete}
        pendingAction={pendingAction}
        onCalculate={onCalculate}
        onPost={onPost}
        onDelete={() => confirm.onOpen("delete")}
      />

      <EntryList
        run={run}
        isCanViewAsset={isCanViewAsset}
        isCanUpdate={isCanUpdate}
      />

      <FormConfirmDialog
        confirm={confirm}
        noun="periode penyusutan"
        descriptions={{
          update:
            pickAction === "post"
              ? postText(period, run)
              : recalculateText(period),
          delete: DELETE_TEXT,
        }}
        onSave={() => onRun(pickAction)}
        onDelete={onDelete}
      />
    </div>
  );
};

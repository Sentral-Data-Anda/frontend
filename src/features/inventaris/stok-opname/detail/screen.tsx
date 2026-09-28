"use client";

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
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { formatDateShort, formatNumber } from "@/lib/format";

import { useOpnameAction, useOpnameDetail } from "../api";
import { OPNAME_LIST_PATH, noteIssueRowsOf, roomNameOf } from "../model";
import type { OpnameAction, OpnameDetail } from "../types";
import { OpnameStatusBadge } from "../ui";

import { CountList } from "./count-list";
import { SELF_POSTING_WARNING, StatusActions } from "./status-actions";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Stok Opname";

const FAILURE_TITLE: Record<OpnameAction, string> = {
  selesai: "Stok opname belum selesai dihitung.",
  posting: "Stok opname belum diposting.",
  batal: "Stok opname belum dibatalkan.",
};

const COMPLETE_TEXT =
  "Apakah Anda ingin menandai stok opname ini selesai dihitung? Hitungan tidak bisa diubah lagi.";

const CANCEL_TEXT =
  "Apakah Anda ingin membatalkan stok opname ini? Hitungannya tetap tersimpan sebagai riwayat.";

const postTextOf = (opname: OpnameDetail) => {
  const different = opname.items.filter((item) => item.difference !== 0);
  const text = `Apakah Anda ingin memposting stok opname ini? Stok ${formatNumber(different.length)} barang disesuaikan dengan hitungan fisik dan tidak bisa dibatalkan.`;

  return opname.isCompletedByViewer ? `${text} ${SELF_POSTING_WARNING}` : text;
};

interface PropTypes {
  code: string;
}

export const OpnameDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const toast = useToast();
  const { isCanView, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.STOK_OPNAME,
  );
  const stockAccess = useMenuAccess(MENU.BARANG_PERSEDIAAN);
  const listReturn = useListReturn(OPNAME_LIST_PATH);
  const detail = useOpnameDetail(isCanView ? code : undefined);
  const action = useOpnameAction(code);
  const confirm = useFormConfirm();
  const [pickAction, setPickAction] = useState<OpnameAction>("selesai");
  const opname = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const failure = action.error;
  const isRecount = failure instanceof FetchError && failure.status === 409;
  const noteIssueRows = noteIssueRowsOf(
    failure instanceof FetchError ? failure.issues : [],
  );

  const header = (
    title: string,
    subtitle?: string,
    status?: OpnameDetail["status"],
  ) => (
    <PageHeader
      title={title}
      subtitle={subtitle}
      backHref={listReturn}
      isBackPersistent
      action={status ? <OpnameStatusBadge status={status} /> : null}
    />
  );

  const onPick = (next: OpnameAction) => {
    setPickAction(next);
    confirm.onOpen(next === "batal" ? "delete" : "update");
  };

  const onRun = (next: OpnameAction) =>
    action.mutate(next, {
      onSuccess: (response) => toast.add({ title: response.message }),
    });

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.INVENTARIS)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Stok Opname"
          description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="stok opname"
        backHref={listReturn}
        backLabel="Kembali ke Stok Opname"
      />
    );
  }

  if (!opname) {
    return (
      <div className="pb-8">
        {header(TITLE)}

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat stok opname"
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
                <DescriptionSkeleton label="Memuat stok opname" rows={4} />
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
        roomNameOf(opname.room),
        `${opname.code} · ${formatDateShort(opname.opnameDate)}`,
        opname.status,
      )}

      <div className="space-y-4 px-gutter pb-4">
        <SummaryPanel opname={opname} />

        <StatusActions
          opname={opname}
          isCanUpdate={isCanUpdate}
          isCanDelete={isCanDelete}
          pendingAction={action.isPending ? action.variables : null}
          onPick={onPick}
        />

        {failure ? (
          <div className="space-y-2">
            <FormAlert
              title={
                isRecount
                  ? "Hitungan perlu diulang."
                  : FAILURE_TITLE[action.variables ?? pickAction]
              }
              message={failure.message}
            />
            {isRecount ? (
              <p className="text-muted-foreground text-body">
                Stok barang itu sudah berubah sesudah dihitung, jadi angka di
                sini tidak lagi cocok. Batalkan stok opname ini, lalu hitung
                ulang lewat stok opname baru.
              </p>
            ) : null}
            {noteIssueRows.size > 0 ? (
              <p className="text-muted-foreground text-body">
                Setiap barang yang selisih wajib punya catatan. Ubah stok opname
                ini dan tulis alasannya di baris yang ditandai.
              </p>
            ) : null}
          </div>
        ) : null}

        <h2 className="text-title pt-2 font-semibold">Barang yang dihitung</h2>
      </div>

      <CountList
        items={opname.items}
        isLinked={stockAccess.isCanView}
        isRefreshing={detail.isFetching}
        noteIssueRows={noteIssueRows}
      />

      <FormConfirmDialog
        confirm={confirm}
        noun="stok opname"
        descriptions={{
          update: pickAction === "posting" ? postTextOf(opname) : COMPLETE_TEXT,
          delete: CANCEL_TEXT,
        }}
        onSave={() => onRun(pickAction)}
        onDelete={() => onRun("batal")}
      />
    </div>
  );
};

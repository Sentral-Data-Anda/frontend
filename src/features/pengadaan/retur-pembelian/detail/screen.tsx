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
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";

import { useReturnAction, useReturnDetail } from "../api";
import { RETURN_LIST_PATH, isOverReturned } from "../model";
import type { ReturnAction } from "../types";
import { ReturnStatusBadge } from "../ui";

import { ItemList } from "./item-list";
import { StatusActions } from "./status-actions";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Retur Pembelian";

const FAILURE_TITLE: Record<ReturnAction, string> = {
  pengajuan: "Retur belum diajukan.",
  selesai: "Retur belum diselesaikan.",
  batal: "Retur belum dibatalkan.",
  hapus: "Retur belum dihapus.",
};

const DESCRIPTIONS: Record<ReturnAction, string> = {
  pengajuan:
    "Apakah Anda ingin mengajukan retur ini untuk disetujui? Retur tidak bisa diubah selama menunggu.",
  selesai:
    "Apakah Anda ingin menyelesaikan retur ini? Stok yang dikembalikan keluar dan barang aset dicabut dari daftar. Tindakan ini tidak bisa dibatalkan.",
  batal:
    "Apakah Anda ingin membatalkan retur ini? Retur yang dibatalkan tidak bisa dilanjutkan.",
  hapus: "Apakah Anda ingin menghapus data retur pembelian ini?",
};

interface PropTypes {
  publicId: string;
}

export const ReturnDetailScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView } = useMenuAccess(MENU.PURCHASE_RETURN);
  const listReturn = useListReturn(RETURN_LIST_PATH);
  const detail = useReturnDetail(isCanView ? publicId : undefined);
  const action = useReturnAction(publicId);
  const confirm = useFormConfirm();
  const [pickAction, setPickAction] = useState<ReturnAction>("pengajuan");
  const row = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const failure = action.error;
  const isOver = failure ? isOverReturned(failure.message) : false;

  const onPick = (next: ReturnAction) => {
    setPickAction(next);
    confirm.onOpen(
      next === "pengajuan" || next === "selesai" ? "update" : "delete",
    );
  };

  const onRun = (next: ReturnAction) =>
    action.mutate(next, {
      onSuccess: (response) => {
        toast.add({ title: response.message });
        if (next === "hapus") router.replace(listReturn);
      },
    });

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.PROCUREMENT)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Retur Pembelian"
          description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="retur pembelian"
        backHref={listReturn}
        backLabel="Kembali ke Retur Pembelian"
      />
    );
  }

  if (!row) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat retur pembelian"
              description={detail.error.message}
              action={
                <Button
                  type="button"
                  variant="outline"
                  disabled={detail.isFetching}
                  onClick={() => void detail.refetch()}
                  isLoading={detail.isFetching}
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
                <DescriptionSkeleton label="Memuat retur pembelian" rows={5} />
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
        title={row.reason}
        subtitle={[row.code, row.supplier?.name].filter(Boolean).join(" · ")}
        backHref={listReturn}
        isBackPersistent
        action={<ReturnStatusBadge status={row.status} />}
      />

      <div className="space-y-4 px-gutter pb-4">
        <SummaryPanel row={row} />

        <StatusActions
          row={row}
          pendingAction={action.isPending ? action.variables : null}
          onPick={onPick}
        />

        {failure ? (
          <FormAlert
            tone={isOver ? "info" : "error"}
            title={
              isOver
                ? "Jumlah retur melebihi yang masih bisa dikembalikan."
                : FAILURE_TITLE[action.variables ?? pickAction]
            }
            message={failure.message}
          />
        ) : null}

        <h2 className="text-title pt-2 font-semibold">
          Barang yang dikembalikan
        </h2>
      </div>

      <ItemList items={row.items} isRefreshing={detail.isFetching} />

      <FormConfirmDialog
        confirm={confirm}
        noun="retur pembelian"
        descriptions={{
          update: DESCRIPTIONS[pickAction],
          delete: DESCRIPTIONS[pickAction],
        }}
        onSave={() => onRun(pickAction)}
        onDelete={() => onRun(pickAction)}
      />
    </div>
  );
};

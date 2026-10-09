"use client";

import { useToast } from "@/components/common/feedback";
import {
  FormConfirmDialog,
  FormAlert,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { formatDateShort } from "@/lib/format";

import { useDisposalDetail, useWithdrawDisposal } from "../../api";
import { DetailFrame } from "../../detail-frame";
import {
  CYCLE_LIST_PATH,
  isRequestFinished,
  kindReturnHref,
} from "../../model";

import { DisposalPanel } from "./disposal-panel";
import { WithdrawAction } from "./withdraw-action";

const DESCRIPTIONS = {
  delete:
    "Apakah Anda ingin menarik pengajuan pelepasan ini? Barang kembali aktif.",
};

interface PropTypes {
  code: string;
}

export const DisposalDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const toast = useToast();
  const { isCanView, isCanDelete } = useMenuAccess(MENU.ASSET_TRANSACTION);
  const backHref = kindReturnHref(useListReturn(CYCLE_LIST_PATH), "pelepasan");
  const detail = useDisposalDetail(isCanView ? code : undefined);
  const withdraw = useWithdrawDisposal(code);
  const confirm = useFormConfirm();
  const row = detail.data;
  const error = withdraw.error?.message ?? null;
  const isFinished = error !== null && isRequestFinished(error);

  const onWithdraw = () =>
    withdraw.mutate(undefined, {
      onSuccess: (saved) => toast.add({ title: saved.message }),
    });

  return (
    <DetailFrame noun="pelepasan" backHref={backHref} query={detail}>
      {row ? (
        <div className="pb-8">
          <PageHeader
            title={row.asset.name}
            subtitle={`${row.code} · ${formatDateShort(row.disposalDate)}`}
            backHref={backHref}
            isBackPersistent
          />

          <div className="px-gutter">
            <DisposalPanel row={row} />

            {row.status === "PENDING" && isCanDelete ? (
              <WithdrawAction
                isWithdrawing={withdraw.isPending}
                error={error}
                onWithdraw={() => confirm.onOpen("delete")}
              />
            ) : null}

            {isFinished && row.status !== "PENDING" ? (
              <div className="pt-4">
                <FormAlert
                  tone="info"
                  title="Permintaan ini sudah diputus sebelum ditarik."
                  message={error}
                />
              </div>
            ) : null}
          </div>

          <FormConfirmDialog
            confirm={confirm}
            noun="pelepasan"
            descriptions={DESCRIPTIONS}
            onDelete={onWithdraw}
          />
        </div>
      ) : null}
    </DetailFrame>
  );
};

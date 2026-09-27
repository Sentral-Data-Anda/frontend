import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { Panel } from "@/components/common/display";
import { MENU, rejectHref } from "@/config/menu";
import { cn } from "@/lib/utils";

import { stagePosition } from "../model";
import type { ApprovalDetail } from "../types";

interface PropTypes {
  request: ApprovalDetail;
  isCanUpdate: boolean;
  isBusy: boolean;
  onApprove: () => void;
  onWithdraw: () => void;
}

export const ActionPanel = (props: PropTypes) => {
  const { request, isCanUpdate, isBusy, onApprove, onWithdraw } = props;

  const isSignable = isCanUpdate && request.canSign;
  const isWithdrawable = isCanUpdate && request.canWithdraw;

  if (!isSignable && !isWithdrawable) return null;

  return (
    <Panel label="Tindakan" className="space-y-3 px-gutter py-4">
      {isSignable ? (
        <>
          <p className="text-body">
            Menunggu tanda tangan Anda di tahap {stagePosition(request)}.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              href={rejectHref(
                MENU.PERSETUJUAN,
                MENU.PERMINTAAN_PERSETUJUAN,
                request.publicId,
              )}
              aria-disabled={isBusy || undefined}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "text-destructive hover:text-destructive",
                isBusy && "pointer-events-none opacity-50",
              )}
            >
              Tolak
            </Link>
            <Button type="button" disabled={isBusy} onClick={onApprove}>
              Setujui
            </Button>
          </div>
        </>
      ) : null}

      {isWithdrawable ? (
        <>
          <p className="text-body">
            Pengajuan Anda masih menunggu. Tarik bila dokumennya perlu diubah.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={isBusy}
              onClick={onWithdraw}
            >
              Tarik pengajuan
            </Button>
          </div>
        </>
      ) : null}
    </Panel>
  );
};

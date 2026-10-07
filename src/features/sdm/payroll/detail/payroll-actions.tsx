"use client";

import { Button } from "@/components/common/control";
import { FormActions } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import {
  PAID_FINAL_NOTE,
  PAY_READINESS_NOTE,
  UNDER_APPROVAL_NOTE,
  isCalculable,
  isCancellable,
  isDeletable,
  isPayable,
  isSubmittable,
  isUnderApproval,
} from "../model";
import type { PayrollAction, PayrollRunDetail } from "../types";

export type PickedAction = PayrollAction | "hapus";

const PENDING_LABEL: Record<PickedAction, string> = {
  hitung: "Menghitung…",
  pengajuan: "Mengajukan…",
  bayar: "Membayarkan…",
  batal: "Membatalkan…",
  hapus: "Menghapus…",
};

/**
 * Tombol yang statusnya tidak mengizinkan TIDAK ADA di DOM, bukan disabled —
 * dan tidak ada satu pun jalan keluar dari PAID, karena tidak ada satu pun di
 * be-sada: itulah yang membuat posting jurnal aman tanpa jalur pembalikan.
 * Menarik pengajuan juga tidak di sini; Penggajian tidak punya endpoint tarik,
 * dan penariknya di Permintaan Persetujuan.
 */
const leadOf = (run: PayrollRunDetail) => {
  if (run.status === "PAID") return PAID_FINAL_NOTE;
  if (run.status === "CANCELLED") return "Penggajian ini dibatalkan.";
  if (isUnderApproval(run)) return UNDER_APPROVAL_NOTE;
  if (run.status === "APPROVED") return PAY_READINESS_NOTE;
  if (run.status === "CALCULATED") {
    return "Sudah dihitung. Periksa slipnya, lalu ajukan untuk ditandatangani.";
  }

  return "Masih draf. Hitung gajinya dari kontrak dan komponen yang berlaku.";
};

interface PropTypes {
  run: PayrollRunDetail;
  pendingAction: PickedAction | null;
  onPick: (action: PickedAction) => void;
}

export const PayrollActions = (props: PropTypes) => {
  const { run, pendingAction, onPick } = props;

  const { isCanUpdate, isCanDelete } = useMenuAccess(MENU.PAYROLL);
  const isBusy = pendingAction !== null;

  const labelOf = (action: PickedAction, idle: string) =>
    pendingAction === action ? PENDING_LABEL[action] : idle;

  const isOffered =
    (isCanUpdate &&
      (isCalculable(run) || isSubmittable(run) || isPayable(run))) ||
    (isCanDelete && (isCancellable(run) || isDeletable(run)));

  // Bilah aksi kosong adalah bilah yang menjanjikan tombol yang tidak ada:
  // run yang sudah dibayar tidak punya satu pun, dan kalimatnya saja yang
  // tersisa.
  if (!isOffered) {
    return (
      <p className="text-muted-foreground px-gutter pb-4 text-caption">
        {leadOf(run)}
      </p>
    );
  }

  return (
    <FormActions status={leadOf(run)}>
      {isCanUpdate && isCalculable(run) ? (
        <Button
          type="button"
          variant={run.status === "CALCULATED" ? "outline" : "default"}
          disabled={isBusy}
          onClick={() => onPick("hitung")}
        >
          {labelOf(
            "hitung",
            run.status === "CALCULATED" ? "Hitung ulang" : "Hitung gaji",
          )}
        </Button>
      ) : null}

      {isCanUpdate && isSubmittable(run) ? (
        <Button
          type="button"
          disabled={isBusy}
          onClick={() => onPick("pengajuan")}
        >
          {labelOf("pengajuan", "Ajukan untuk persetujuan")}
        </Button>
      ) : null}

      {isCanUpdate && isPayable(run) ? (
        <Button type="button" disabled={isBusy} onClick={() => onPick("bayar")}>
          {labelOf("bayar", "Tandai sudah dibayar")}
        </Button>
      ) : null}

      {isCanDelete && isCancellable(run) ? (
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={() => onPick("batal")}
        >
          {labelOf("batal", "Batalkan")}
        </Button>
      ) : null}

      {isCanDelete && isDeletable(run) ? (
        <Button
          type="button"
          variant="destructive"
          disabled={isBusy}
          onClick={() => onPick("hapus")}
        >
          {labelOf("hapus", "Hapus")}
        </Button>
      ) : null}
    </FormActions>
  );
};

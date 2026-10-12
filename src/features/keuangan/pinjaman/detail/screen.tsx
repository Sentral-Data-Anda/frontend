"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { Badge, PANEL_TITLE, Panel } from "@/components/common/display";
import { EmptyState, useToast } from "@/components/common/feedback";
import { ConfirmDialog } from "@/components/common/overlay";
import { PageHeader } from "@/components/layout";
import { MENU, detailHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { formatDate } from "@/lib/format";

import { useDeleteLoan, useLoanDetail, useSetLoanStatus } from "../api";
import {
  DIRECTION_LABEL,
  interestLabelOf,
  NO_VIEW,
  PINJAMAN_PATH,
  STATUS_LABEL,
  TITLE,
  money,
  pinjamanEditHref,
} from "../model";

import { LoanLines } from "./loan-lines";
import { LoanSchedule } from "./loan-schedule";

interface PropTypes {
  publicId: string;
}

export const PinjamanDetailScreen = (props: PropTypes) => {
  const { publicId } = props;

  const toast = useToast();
  const { isCanView, isCanUpdate, isCanDelete } = useMenuAccess(MENU.LOAN);
  const listReturn = useListReturn(PINJAMAN_PATH);
  const detail = useLoanDetail(isCanView ? publicId : undefined);
  const setStatus = useSetLoanStatus(publicId);
  const removeLoan = useDeleteLoan(publicId);
  const isSettleOpen = useBoolean();
  const isDeleteOpen = useBoolean();

  const loan = detail.data;

  if (!isCanView) {
    return (
      <div className="pb-6">
        <PageHeader title={TITLE} backHref={listReturn} />
        <EmptyState
          title="Anda tidak memiliki akses ke Pinjaman"
          description={NO_VIEW}
        />
      </div>
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <div className="pb-6">
        <PageHeader title={TITLE} backHref={listReturn} />
        <EmptyState
          title="Pinjaman tidak ditemukan"
          description="Pinjaman ini sudah dihapus atau tautannya tidak berlaku lagi."
        />
      </div>
    );
  }

  const settlement = loan?.settlement;

  const onSettle = async () => {
    const next = loan?.status === "SETTLED" ? "ACTIVE" : "SETTLED";
    const result = await setStatus.mutateAsync(next);

    toast.add({ title: result.message });
  };

  const onDelete = async () => {
    const result = await removeLoan.mutateAsync();

    toast.add({ title: result.message });
  };

  return (
    <div className="pb-6">
      <PageHeader
        title={loan?.counterpartyName ?? TITLE}
        subtitle={
          loan ? `${loan.code} · ${DIRECTION_LABEL[loan.direction]}` : undefined
        }
        backHref={listReturn}
        action={
          loan && isCanUpdate ? (
            <span className="flex items-center gap-2">
              <Link
                href={pinjamanEditHref(publicId)}
                className={buttonVariants({ variant: "outline" })}
              >
                Ubah
              </Link>

              <Button
                type="button"
                variant="outline"
                onClick={isSettleOpen.onTrue}
              >
                {loan.status === "SETTLED" ? "Buka kembali" : "Tandai lunas"}
              </Button>
            </span>
          ) : null
        }
      />

      {loan ? (
        <div className="space-y-4 px-gutter">
          <Panel label="Ringkasan">
            <h2 className={`${PANEL_TITLE} pb-3`}>Ringkasan</h2>

            <dl className="divide-hairline grid divide-y">
              {[
                [
                  "Status",
                  <Badge key="s" variant="neutral">
                    {STATUS_LABEL[loan.status]}
                  </Badge>,
                ],
                ["Tanggal kesepakatan", formatDate(loan.agreementDate)],
                ["Jangka waktu", `${loan.termMonths} bulan`],
                [
                  "Dasar bunga",
                  interestLabelOf(loan.interestMode, loan.interestPercent),
                ],
                ["Pokok", money(loan.principal)],
                ["Bunga", money(loan.interestAmount)],
                [
                  "Total kembali",
                  money(
                    String(
                      Number(loan.principal) + Number(loan.interestAmount),
                    ),
                  ),
                ],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <dt className="text-muted-foreground text-body">{label}</dt>
                  <dd className="text-body font-medium tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>

          {settlement ? (
            <Panel label="Sisa">
              <h2 className={`${PANEL_TITLE} pb-1`}>Sisa</h2>

              <p className="text-muted-foreground pb-3 text-body">
                Dihitung dari baris Kas Masuk dan Kas Keluar yang menunjuk
                pinjaman ini. Hanya dokumen yang sudah dibayar atau diterima
                yang ikut; draf belum.
              </p>

              <dl className="divide-hairline grid divide-y">
                {[
                  ["Sudah cair", settlement.disbursed],
                  ["Pokok terbayar", settlement.principalPaid],
                  ["Sisa pokok", settlement.principalOutstanding],
                  ["Bunga terbayar", settlement.interestPaid],
                  ["Sisa bunga", settlement.interestOutstanding],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <dt className="text-muted-foreground text-body">{label}</dt>
                    <dd className="text-body font-medium tabular-nums">
                      {money(value)}
                    </dd>
                  </div>
                ))}
              </dl>

              {settlement.isFullyDisbursed ? null : (
                <p className="text-muted-foreground pt-3 text-caption">
                  Pokok yang disepakati {money(loan.principal)} belum cair
                  seluruhnya. Yang belum sampai belum terhitung sebagai pinjaman
                  berjalan.
                </p>
              )}
            </Panel>
          ) : null}

          <LoanSchedule rows={loan.schedule} />

          <LoanLines lines={loan.lines} />

          {isCanDelete ? (
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="text-destructive border-destructive/40"
                onClick={isDeleteOpen.onTrue}
              >
                Hapus pinjaman
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={isSettleOpen.value}
        onOpenChange={isSettleOpen.setValue}
        title={
          loan?.status === "SETTLED"
            ? "Buka kembali pinjaman ini?"
            : "Tandai pinjaman ini lunas?"
        }
        description="Status ini tidak mengubah angka apa pun. Sisa pinjaman tetap dihitung dari catatan kas."
        confirmLabel="Lanjutkan"
        cancelLabel="Batal"
        onConfirm={() => void onSettle()}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen.value}
        onOpenChange={isDeleteOpen.setValue}
        title="Hapus pinjaman ini?"
        description="Pinjaman yang sudah punya catatan kas tidak dapat dihapus."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        isDestructive
        onConfirm={() => void onDelete()}
      />
    </div>
  );
};

export const loanDetailHref = (publicId: string) =>
  detailHref(MENU.FINANCE, MENU.LOAN, publicId);

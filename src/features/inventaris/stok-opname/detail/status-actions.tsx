"use client";

import { Pencil, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { cn } from "@/lib/utils";

import { opnameEditHref } from "../model";
import type { OpnameAction, OpnameDetail } from "../types";

export const SELF_POSTING_WARNING =
  "Anda sendiri yang menandai hitungan ini selesai; sebaiknya posting dilakukan orang lain.";

const LEAD = {
  DRAFT:
    "Hitungan masih bisa diubah. Tandai selesai dihitung bila semua barang sudah dihitung.",
  COMPLETED:
    "Hitungan sudah tidak bisa diubah. Posting menyesuaikan stok di aplikasi dengan hitungan fisik.",
} as const;

const PENDING_LABEL: Record<OpnameAction, string> = {
  selesai: "Menyimpan…",
  posting: "Memposting…",
  batal: "Membatalkan…",
};

interface PropTypes {
  opname: OpnameDetail;
  isCanUpdate: boolean;
  isCanDelete: boolean;
  pendingAction: OpnameAction | null;
  onPick: (action: OpnameAction) => void;
}

export const StatusActions = (props: PropTypes) => {
  const { opname, isCanUpdate, isCanDelete, pendingAction, onPick } = props;

  const { status } = opname;
  const isOpen = status === "DRAFT" || status === "COMPLETED";
  const isBusy = pendingAction !== null;
  const isWarned =
    status === "COMPLETED" && isCanUpdate && opname.isCompletedByViewer;

  const labelOf = (action: OpnameAction, idle: string) =>
    pendingAction === action ? PENDING_LABEL[action] : idle;

  if (!isOpen || !(isCanUpdate || isCanDelete)) return null;

  return (
    <section aria-label="Aksi stok opname" className="space-y-3">
      {isCanUpdate ? (
        <p className="text-muted-foreground text-body">{LEAD[status]}</p>
      ) : null}

      {isWarned ? (
        <p className="border-warning bg-warning/10 flex w-fit max-w-full items-start gap-2 rounded-control border px-3 py-2 text-body">
          <TriangleAlert
            aria-hidden
            className="text-warning-foreground mt-0.5 size-4 shrink-0"
          />
          {SELF_POSTING_WARNING}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {isCanDelete ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isBusy}
            onClick={() => onPick("batal")}
          >
            {labelOf("batal", "Batalkan")}
          </Button>
        ) : null}

        {status === "DRAFT" && isCanUpdate ? (
          <>
            <Link
              href={opnameEditHref(opname.code)}
              aria-disabled={isBusy || undefined}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-50",
              )}
            >
              <Pencil aria-hidden />
              Ubah
            </Link>
            <Button
              type="button"
              disabled={isBusy}
              onClick={() => onPick("selesai")}
            >
              {labelOf("selesai", "Selesai dihitung")}
            </Button>
          </>
        ) : null}

        {status === "COMPLETED" && isCanUpdate ? (
          <Button
            type="button"
            disabled={isBusy}
            onClick={() => onPick("posting")}
          >
            {labelOf("posting", "Posting")}
          </Button>
        ) : null}
      </div>
    </section>
  );
};

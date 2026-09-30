"use client";

import { Pencil, RotateCcw, Stamp } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import {
  isEditable,
  isReversible,
  journalEditHref,
  postBlockReasonOf,
} from "../model";
import type { JournalEntryDetail } from "../types";

export type EntryAction = "posting" | "balikkan" | "hapus";

const PENDING_LABEL: Record<EntryAction, string> = {
  posting: "Memposting…",
  balikkan: "Membalik…",
  hapus: "Menghapus…",
};

const BLOCK_ID = "posting-blocked";

interface PropTypes {
  entry: JournalEntryDetail;
  pendingAction: EntryAction | null;
  onPick: (action: EntryAction) => void;
}

export const EntryActions = (props: PropTypes) => {
  const { entry, pendingAction, onPick } = props;

  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(MENU.JURNAL);
  const isBusy = pendingAction !== null;
  const isDraft = isEditable(entry);
  const blockReason = isDraft ? postBlockReasonOf(entry) : null;
  const isPostable = isDraft && isCanUpdate;
  const isReverseOffered = isReversible(entry) && isCanCreate;
  const isRemovable = isDraft && isCanDelete;

  const labelOf = (action: EntryAction, idle: string) =>
    pendingAction === action ? PENDING_LABEL[action] : idle;

  if (!isPostable && !isReverseOffered && !isRemovable && !isDraft) return null;

  return (
    <section aria-label="Aksi entri" className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {isPostable ? (
          <Button
            type="button"
            disabled={isBusy || blockReason !== null}
            aria-describedby={blockReason ? BLOCK_ID : undefined}
            onClick={() => onPick("posting")}
          >
            <Stamp aria-hidden />
            {labelOf("posting", "Posting")}
          </Button>
        ) : null}

        {isReverseOffered ? (
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={() => onPick("balikkan")}
          >
            <RotateCcw aria-hidden />
            {labelOf("balikkan", "Balikkan")}
          </Button>
        ) : null}

        {isDraft && isCanUpdate ? (
          <Link
            href={journalEditHref(entry.publicId)}
            aria-disabled={isBusy || undefined}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-50",
            )}
          >
            <Pencil aria-hidden />
            Ubah
          </Link>
        ) : null}

        {isRemovable ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isBusy}
            onClick={() => onPick("hapus")}
          >
            {labelOf("hapus", "Hapus")}
          </Button>
        ) : null}
      </div>

      {blockReason && isPostable ? (
        <p id={BLOCK_ID} className="text-warning-foreground text-body">
          {`Belum bisa diposting. ${blockReason}`}
        </p>
      ) : null}
    </section>
  );
};

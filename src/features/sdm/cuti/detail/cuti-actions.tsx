"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { MENU, editHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import type { CutiAction } from "../api";
import { isCancellable, isEditable } from "../model";
import type { Cuti } from "../types";

interface PropTypes {
  cuti: Cuti;
  today: string;
  isBusy: boolean;
  onPick: (action: CutiAction) => void;
}

export const CutiActions = (props: PropTypes) => {
  const { cuti, today, isBusy, onPick } = props;

  const { isCanUpdate, isCanDelete } = useMenuAccess(MENU.LEAVE);
  const isOpen = isEditable(cuti);

  return (
    <div className="flex flex-wrap gap-2 px-gutter">
      {isCanUpdate && isOpen ? (
        <Button
          type="button"
          disabled={isBusy}
          onClick={() => onPick("pengajuan")}
        >
          Ajukan untuk persetujuan
        </Button>
      ) : null}

      {isCanUpdate && isOpen ? (
        <Link
          href={editHref(MENU.HR, MENU.LEAVE, cuti.code)}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "cursor-pointer",
          )}
        >
          Ubah
        </Link>
      ) : null}

      {isCanDelete && isCancellable(cuti, today) ? (
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={() => onPick("batal")}
        >
          Batalkan cuti
        </Button>
      ) : null}

      {isCanDelete && isOpen ? (
        <Button
          type="button"
          variant="destructive"
          disabled={isBusy}
          onClick={() => onPick("hapus")}
        >
          Hapus
        </Button>
      ) : null}
    </div>
  );
};

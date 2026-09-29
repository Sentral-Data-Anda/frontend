import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { formatDate } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { currencyDetailHref, rateEditHref } from "../model";
import type { Rate } from "../types";

interface PropTypes {
  rate: Rate;
  isCanUpdate: boolean;
  isCanDelete: boolean;
  isDisabled: boolean;
  onDelete: (rate: Rate) => void;
}

export const RateActions = (props: PropTypes) => {
  const { rate, isCanUpdate, isCanDelete, isDisabled, onDelete } = props;

  const dateLabel = formatDate(rate.rateDate);

  const onEdit = () =>
    saveListFocus(currencyDetailHref(rate.currencyCode), String(rate.id));

  return (
    <span className="relative flex items-center gap-1">
      {isCanUpdate ? (
        <Link
          href={rateEditHref(rate.currencyCode, rate.id)}
          onClick={onEdit}
          aria-label={`Ubah kurs ${dateLabel}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "cursor-pointer",
          )}
        >
          <Pencil aria-hidden />
        </Link>
      ) : null}

      {isCanDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Hapus kurs ${dateLabel}`}
          disabled={isDisabled}
          onClick={() => onDelete(rate)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 aria-hidden />
        </Button>
      ) : null}
    </span>
  );
};

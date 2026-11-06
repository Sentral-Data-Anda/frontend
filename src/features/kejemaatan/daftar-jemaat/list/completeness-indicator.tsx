"use client";

import { Popover } from "@base-ui/react/popover";
import Link from "next/link";
import { useId } from "react";

import { buttonVariants, FIELD_POPUP } from "@/components/common/control";
import { useBoolean } from "@/hooks/use-boolean";
import { cn } from "@/lib/utils";

import {
  MISSING_FIELD_LABEL,
  missingFieldLabels,
  type MissingFieldKey,
} from "../completeness";

export const INCOMPLETE_LABEL = "Tidak Lengkap";
export const COMPLETE_LABEL = "Lengkap";

interface PropTypes {
  missingFields: readonly MissingFieldKey[];
  editHref: string | null;
  onNavigate?: () => void;
}

/**
 * Sel kolom "Kelengkapan" di tabel. Nilainya cuma dua kata — "Lengkap" atau
 * "Tidak Lengkap" — supaya kolom bisa dibaca sekilas tanpa menerjemahkan ikon.
 * Rincian field yang kurang pindah ke tooltip, muncul saat hover, fokus, atau
 * klik, jadi baris yang sudah lengkap tidak menyisakan apa pun untuk dibuka.
 *
 * Versi ringkas untuk layar sempit ada di meta baris (`list-item.tsx`), bukan
 * di sini: di sana tidak ada kolom, jadi statusnya ikut menempel ke teks tipe.
 */
export const CompletenessIndicator = (props: PropTypes) => {
  const { missingFields, editHref, onNavigate } = props;

  const isOpen = useBoolean();
  const panelId = useId();
  const titleId = useId();

  if (missingFields.length === 0) {
    return (
      <span className="text-muted-foreground text-caption">
        {COMPLETE_LABEL}
      </span>
    );
  }

  const summary = missingFieldLabels(missingFields).join(", ");

  return (
    <Popover.Root open={isOpen.value} onOpenChange={isOpen.setValue}>
      <Popover.Trigger
        openOnHover
        delay={120}
        closeDelay={120}
        aria-label={`${INCOMPLETE_LABEL}: ${summary}`}
        aria-haspopup="dialog"
        aria-controls={isOpen.value ? panelId : undefined}
        className="text-warning-foreground cursor-help rounded-xs text-caption font-medium underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {INCOMPLETE_LABEL}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={6}
          className="z-50 outline-none"
        >
          <Popover.Popup
            id={panelId}
            aria-labelledby={titleId}
            className={cn(FIELD_POPUP, "w-60 p-3")}
          >
            <p
              id={titleId}
              className="text-muted-foreground text-caption font-medium"
            >
              Data belum lengkap
            </p>

            <ul className="mt-1.5 space-y-0.5">
              {missingFields.map((field) => (
                <li
                  key={field}
                  className="flex items-start gap-1.5 text-body leading-snug"
                >
                  <span aria-hidden className="text-warning-foreground">
                    •
                  </span>
                  {MISSING_FIELD_LABEL[field]}
                </li>
              ))}
            </ul>

            {editHref ? (
              <Link
                href={editHref}
                onClick={onNavigate}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "mt-3 w-full",
                )}
              >
                Lengkapi data
              </Link>
            ) : null}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};

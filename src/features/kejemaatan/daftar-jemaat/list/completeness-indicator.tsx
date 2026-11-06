"use client";

import { Popover } from "@base-ui/react/popover";
import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { useId } from "react";

import {
  Button,
  buttonVariants,
  FIELD_POPUP,
} from "@/components/common/control";
import { BottomSheet } from "@/components/common/overlay";
import { useBoolean } from "@/hooks/use-boolean";
import { useIsTableWidth } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

import {
  MISSING_FIELD_LABEL,
  missingFieldLabels,
  type MissingFieldKey,
} from "../completeness";

interface PropTypes {
  missingFields: readonly MissingFieldKey[];
  editHref: string | null;
  onNavigate?: () => void;
  isCompleteLabelVisible?: boolean;
}

export const CompletenessIndicator = (props: PropTypes) => {
  const {
    missingFields,
    editHref,
    onNavigate,
    isCompleteLabelVisible = false,
  } = props;

  const isOpen = useBoolean();
  const isTableWidth = useIsTableWidth();
  const panelId = useId();
  const labels = missingFieldLabels(missingFields);
  const summary = labels.join(", ");
  const triggerLabel = `Data belum lengkap: ${summary}`;
  const triggerTitle = `Belum lengkap: ${summary}`;

  if (missingFields.length === 0) {
    return isCompleteLabelVisible ? (
      <span className="text-muted-foreground text-caption">Lengkap</span>
    ) : null;
  }

  const body = (
    <>
      <ul className="mt-2 space-y-1">
        {missingFields.map((field) => (
          <li key={field} className="flex items-start gap-2 text-body">
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
    </>
  );

  if (isTableWidth === false) {
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={triggerLabel}
          aria-haspopup="dialog"
          aria-expanded={isOpen.value}
          aria-controls={panelId}
          title={triggerTitle}
          onClick={isOpen.onTrue}
          className="bg-warning text-warning-foreground hover:bg-warning/80 rounded-full"
        >
          <CircleAlert aria-hidden />
        </Button>

        <BottomSheet
          id={panelId}
          isOpen={isOpen.value}
          title="Data belum lengkap"
          onClose={isOpen.onFalse}
        >
          {isOpen.value ? <div className="px-gutter pb-4">{body}</div> : null}
        </BottomSheet>
      </>
    );
  }

  return (
    <Popover.Root open={isOpen.value} onOpenChange={isOpen.setValue}>
      <Popover.Trigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="bg-warning text-warning-foreground hover:bg-warning/80 rounded-full"
          />
        }
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        aria-controls={isOpen.value ? panelId : undefined}
        title={triggerTitle}
      >
        <CircleAlert aria-hidden />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={4}
          className="z-50 outline-none"
        >
          <Popover.Popup
            id={panelId}
            aria-label="Data belum lengkap"
            className={cn(FIELD_POPUP, "w-64 p-4")}
          >
            <p className="text-title font-semibold">Data belum lengkap</p>
            {body}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};

"use client";

import { Popover } from "@base-ui/react/popover";
import { SlidersHorizontal } from "lucide-react";
import { useId } from "react";

import { FIELD_POPUP } from "@/components/common/control";
import { BottomSheet } from "@/components/common/overlay";
import { Button } from "@/components/ui";
import { useBoolean } from "@/hooks/use-boolean";
import { useIsTableWidth } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

import type { FilterValues, ListFilter } from "./list-filter";
import { ListFilterForm } from "./list-filter-form";

interface PropTypes {
  filters: readonly ListFilter[];
  values: FilterValues;
  activeCount: number;
  onApply: (values: FilterValues) => void;
}

export const ListFilterButton = (props: PropTypes) => {
  const { filters, values, activeCount, onApply } = props;

  const isOpen = useBoolean();
  const isTableWidth = useIsTableWidth();
  const panelId = useId();

  const onApplyDraft = (draft: FilterValues) => {
    onApply(draft);
    isOpen.onFalse();
  };

  const name = activeCount > 0 ? `Filter, ${activeCount} aktif` : undefined;

  const label = (
    <>
      <SlidersHorizontal aria-hidden />
      Filter
      {activeCount > 0 ? (
        <span
          aria-hidden
          className="bg-primary text-primary-foreground flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-caption tabular-nums"
        >
          {activeCount}
        </span>
      ) : null}
    </>
  );

  const form = (
    <ListFilterForm filters={filters} values={values} onApply={onApplyDraft} />
  );

  if (isTableWidth === false) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          aria-label={name}
          aria-haspopup="dialog"
          aria-expanded={isOpen.value}
          aria-controls={panelId}
          onClick={isOpen.onTrue}
          className={TRIGGER}
        >
          {label}
        </Button>

        <BottomSheet
          id={panelId}
          isOpen={isOpen.value}
          title="Filter"
          onClose={isOpen.onFalse}
        >
          {isOpen.value ? <div className="px-gutter">{form}</div> : null}
        </BottomSheet>
      </>
    );
  }

  return (
    <Popover.Root open={isOpen.value} onOpenChange={isOpen.setValue}>
      <Popover.Trigger
        render={<Button type="button" variant="outline" />}
        aria-label={name}
        aria-controls={isOpen.value ? panelId : undefined}
        className={TRIGGER}
      >
        {label}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 outline-none"
        >
          <Popover.Popup
            id={panelId}
            aria-label="Filter"
            className={cn(FIELD_POPUP, "max-h-(--available-height) w-72 p-4")}
          >
            {form}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};

const TRIGGER = "shrink-0 cursor-pointer bg-card";

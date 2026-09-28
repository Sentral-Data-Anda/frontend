"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { useContext } from "react";

import { EmptyState } from "@/components/common/feedback";
import {
  MENU_ITEM,
  MENU_POPUP,
  SheetPortalContext,
} from "@/components/common/overlay";
import { inputVariants } from "@/components/ui";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
  isDisabled?: boolean;
};

export const FIELD_POPUP = `${MENU_POPUP} max-h-[min(18rem,var(--available-height))] w-(--anchor-width) origin-(--transform-origin) overflow-y-auto overscroll-contain transition-[opacity,scale] duration-100 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0`;

export const FIELD_ITEM = `${MENU_ITEM} group grid cursor-pointer grid-cols-[1rem_1fr] data-disabled:cursor-not-allowed data-disabled:text-muted-foreground data-disabled:data-highlighted:bg-muted data-disabled:data-highlighted:text-muted-foreground`;

export const FIELD_HINT =
  "text-muted-foreground group-data-highlighted:text-primary-foreground/80 group-data-disabled:group-data-highlighted:text-muted-foreground ms-auto shrink-0 text-caption font-normal whitespace-nowrap";

interface PropTypes {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-label"?: string;
}

export const SelectField = (props: PropTypes) => {
  const {
    id,
    value,
    onValueChange,
    options,
    placeholder = "Pilih",
    disabled = false,
    emptyMessage = "Belum ada pilihan",
    className,
    ...aria
  } = props;

  const sheet = useContext(SheetPortalContext);

  return (
    <Select.Root
      items={options}
      value={value || null}
      onValueChange={(next) => onValueChange((next as string | null) ?? "")}
      disabled={disabled}
    >
      <Select.Trigger
        id={id}
        {...aria}
        className={cn(
          inputVariants({ variant: "outline" }),
          "flex cursor-pointer items-center justify-between gap-2 text-left hover:bg-accent data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-popup-open:border-primary",
          className,
        )}
      >
        <Select.Value
          className="truncate data-placeholder:text-muted-foreground"
          placeholder={placeholder}
        />
        <Select.Icon className="text-muted-foreground shrink-0">
          <ChevronDown className="size-3.5" aria-hidden />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal container={sheet ?? undefined}>
        {/* Bawaan Base UI menaruh item terpilih tepat di atas pemicu. */}
        <Select.Positioner
          alignItemWithTrigger={false}
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 outline-none"
        >
          <Select.Popup className={FIELD_POPUP}>
            {options.length === 0 ? (
              <EmptyState title={emptyMessage} isCompact />
            ) : (
              <Select.List>
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.isDisabled}
                    className={FIELD_ITEM}
                  >
                    <Select.ItemIndicator className="col-start-1">
                      <Check className="size-3.5" aria-hidden />
                    </Select.ItemIndicator>
                    {option.hint ? (
                      <span className="col-start-2 flex min-w-0 items-baseline gap-2">
                        <Select.ItemText className="truncate">
                          {option.label}
                        </Select.ItemText>
                        <span className={FIELD_HINT}>{option.hint}</span>
                      </span>
                    ) : (
                      <Select.ItemText className="col-start-2 truncate">
                        {option.label}
                      </Select.ItemText>
                    )}
                  </Select.Item>
                ))}
              </Select.List>
            )}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
};

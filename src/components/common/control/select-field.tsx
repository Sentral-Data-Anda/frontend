"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { EmptyState } from "@/components/common/feedback";
import { MENU_ITEM, MENU_POPUP } from "@/components/common/overlay";
import { inputVariants } from "@/components/ui";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

export const FIELD_POPUP = `${MENU_POPUP} max-h-[min(18rem,var(--available-height))] w-(--anchor-width) origin-(--transform-origin) overflow-y-auto overscroll-contain transition-[opacity,scale] duration-100 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0`;

export const FIELD_ITEM = `${MENU_ITEM} grid cursor-pointer grid-cols-[1rem_1fr]`;

export function SelectField({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Pilih",
  disabled = false,
  emptyMessage = "Belum ada pilihan",
  className,
  ...aria
}: {
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
}) {
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

      <Select.Portal>
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
                    className={FIELD_ITEM}
                  >
                    <Select.ItemIndicator className="col-start-1">
                      <Check className="size-3.5" aria-hidden />
                    </Select.ItemIndicator>
                    <Select.ItemText className="col-start-2 truncate">
                      {option.label}
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            )}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

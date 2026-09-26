"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";

import { EmptyState } from "@/components/common/feedback";
import { inputVariants } from "@/components/ui";
import { cn } from "@/lib/utils";

import { FIELD_ITEM, FIELD_POPUP, type SelectOption } from "./select-field";

interface PropTypes {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  isClearable?: boolean;
  onSearch?: (query: string) => void;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export const ComboboxField = (props: PropTypes) => {
  const {
    id,
    value,
    onValueChange,
    options,
    placeholder = "Ketik untuk mencari",
    disabled = false,
    isLoading = false,
    emptyMessage = "Belum ada pilihan",
    isClearable = false,
    onSearch,
    className,
    ...aria
  } = props;

  const selected = options.find((option) => option.value === value) ?? null;

  const isBusy = isLoading && options.length === 0;
  const isOff = disabled || isBusy;

  return (
    <Combobox.Root
      items={options as SelectOption[]}
      value={selected}
      onValueChange={(next) =>
        onValueChange((next as SelectOption | null)?.value ?? "")
      }
      filter={onSearch ? null : undefined}
      onInputValueChange={onSearch}
    >
      <Combobox.InputGroup
        className={cn(
          inputVariants({ variant: "outline" }),
          "relative flex items-center p-0 focus-within:border-primary has-disabled:cursor-not-allowed has-disabled:opacity-50 has-aria-invalid:border-destructive has-aria-invalid:bg-destructive/10",
          className,
        )}
      >
        <Combobox.Input
          id={id}
          disabled={isOff}
          {...aria}
          placeholder={isBusy ? "Memuat…" : placeholder}
          className="h-full min-w-0 flex-1 cursor-pointer bg-transparent pl-2.5 text-body outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />

        <div className="text-muted-foreground flex h-full shrink-0 items-center pr-1">
          {isClearable && value ? (
            <Combobox.Clear
              disabled={isOff}
              aria-label="Kosongkan pilihan"
              className="flex size-6 cursor-pointer items-center justify-center rounded-control hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X className="size-3.5" aria-hidden />
            </Combobox.Clear>
          ) : null}

          <Combobox.Trigger
            disabled={isOff}
            aria-label="Buka pilihan"
            className="flex size-6 cursor-pointer items-center justify-center rounded-control hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <ChevronDown className="size-3.5" aria-hidden />
          </Combobox.Trigger>
        </div>
      </Combobox.InputGroup>

      <Combobox.Portal>
        <Combobox.Positioner
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 outline-none"
        >
          <Combobox.Popup className={FIELD_POPUP}>
            {options.length === 0 ? (
              <EmptyState title={emptyMessage} isCompact />
            ) : (
              <>
                <Combobox.Empty>
                  <EmptyState title="Tidak ada yang cocok" isCompact />
                </Combobox.Empty>

                <Combobox.List>
                  {(option: SelectOption) => (
                    <Combobox.Item
                      key={option.value}
                      value={option}
                      className={FIELD_ITEM}
                    >
                      <Combobox.ItemIndicator className="col-start-1">
                        <Check className="size-3.5" aria-hidden />
                      </Combobox.ItemIndicator>
                      <span className="col-start-2 truncate">
                        {option.label}
                      </span>
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </>
            )}
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
};

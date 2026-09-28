"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/feedback";
import { inputVariants } from "@/components/ui";
import { normalizeName } from "@/lib/name";
import { cn } from "@/lib/utils";

import {
  FIELD_HINT,
  FIELD_ITEM,
  FIELD_POPUP,
  type SelectOption,
} from "./select-field";

const CREATE_VALUE = "\u0000create";

const isSameOption = (item: SelectOption, value: SelectOption) =>
  item.value === value.value;

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
  onCreate?: (text: string) => void;
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
    onCreate,
    className,
    ...aria
  } = props;

  const [query, setQuery] = useState("");
  const collator = Combobox.useFilter();

  const [held, setHeld] = useState<SelectOption | null>(null);

  const found = options.find((option) => option.value === value);
  const isHeld =
    held !== null &&
    held.value === value &&
    (!found || found.label === held.label);
  const selected = isHeld ? held : (found ?? null);
  const createText = onCreate ? normalizeName(query) : "";
  const isCreatable =
    createText !== "" &&
    !options.some(
      (option) => option.label.toLowerCase() === createText.toLowerCase(),
    );
  const items = isCreatable
    ? [...options, { value: CREATE_VALUE, label: createText }]
    : options;

  const isBusy = isLoading && options.length === 0;
  const isOff = disabled || isBusy;

  if (found && !isHeld) setHeld(found);

  const onPick = (next: SelectOption | null) => {
    if (next?.value === CREATE_VALUE) onCreate?.(createText);
    else onValueChange(next?.value ?? "");
  };

  const onType = (text: string) => {
    setQuery(text);
    onSearch?.(text);
  };

  const onFilter = (option: SelectOption, text: string) =>
    option.value === CREATE_VALUE ||
    collator.contains(option, text, (item) => item.label);

  return (
    <Combobox.Root
      items={items as SelectOption[]}
      value={selected}
      isItemEqualToValue={isSameOption}
      onValueChange={(next) => onPick(next as SelectOption | null)}
      filter={onSearch ? null : onCreate ? onFilter : undefined}
      onInputValueChange={onType}
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
            {options.length === 0 && !onCreate ? (
              <EmptyState title={emptyMessage} isCompact />
            ) : (
              <>
                <Combobox.Empty>
                  <EmptyState
                    title={
                      options.length === 0
                        ? emptyMessage
                        : "Tidak ada yang cocok"
                    }
                    isCompact
                  />
                </Combobox.Empty>

                <Combobox.List>
                  {(option: SelectOption) =>
                    option.value === CREATE_VALUE ? (
                      <Combobox.Item
                        key={option.value}
                        value={option}
                        className={cn(FIELD_ITEM, "text-primary font-medium")}
                      >
                        <Plus className="col-start-1 size-3.5" aria-hidden />
                        <span className="col-start-2 truncate">
                          Tambah “{option.label}”
                        </span>
                      </Combobox.Item>
                    ) : (
                      <Combobox.Item
                        key={option.value}
                        value={option}
                        disabled={option.isDisabled}
                        className={cn(FIELD_ITEM)}
                      >
                        <Combobox.ItemIndicator className="col-start-1">
                          <Check className="size-3.5" aria-hidden />
                        </Combobox.ItemIndicator>
                        {option.hint ? (
                          <span className="col-start-2 flex min-w-0 items-baseline gap-2">
                            <span className="truncate">{option.label}</span>
                            <span className={FIELD_HINT}>{option.hint}</span>
                          </span>
                        ) : (
                          <span className="col-start-2 truncate">
                            {option.label}
                          </span>
                        )}
                      </Combobox.Item>
                    )
                  }
                </Combobox.List>
              </>
            )}
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
};

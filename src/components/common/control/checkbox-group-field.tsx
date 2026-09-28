"use client";

import { cn } from "@/lib/utils";

import { FIELD_HINT, type SelectOption } from "./select-field";

interface PropTypes {
  id: string;
  label: string;
  isLabelVisible?: boolean;
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  options: readonly SelectOption[];
  hint?: string;
  error?: string;
  disabled?: boolean;
  emptyMessage?: string;
}

export const CheckboxGroupField = (props: PropTypes) => {
  const {
    id,
    label,
    isLabelVisible = true,
    value,
    onValueChange,
    options,
    hint,
    error,
    disabled = false,
    emptyMessage = "Belum ada pilihan",
  } = props;

  const message = error ?? hint;
  const messageId = message ? `${id}-${error ? "error" : "hint"}` : undefined;

  const onToggle = (picked: string) =>
    onValueChange(
      options
        .map((option) => option.value)
        .filter((option) =>
          option === picked ? !value.includes(option) : value.includes(option),
        ),
    );

  return (
    <div className="@container">
      <fieldset aria-describedby={messageId}>
        <legend
          className={cn(
            "mb-1.5 text-body font-medium",
            !isLabelVisible && "sr-only",
          )}
        >
          {label}
        </legend>

        {options.length === 0 ? (
          <p className="text-muted-foreground text-body">{emptyMessage}</p>
        ) : (
          <div className="grid grid-cols-1 gap-1.5 @min-[24rem]:grid-cols-2 @min-[40rem]:grid-cols-3">
            {options.map((option, index) => (
              <label key={option.value} className={cn(ITEM, "group")}>
                <input
                  type="checkbox"
                  id={index === 0 ? id : undefined}
                  aria-invalid={index === 0 && error ? true : undefined}
                  checked={value.includes(option.value)}
                  disabled={disabled || option.isDisabled}
                  onChange={() => onToggle(option.value)}
                  className={BOX}
                />
                <span className="min-w-0 truncate">{option.label}</span>
                {option.hint ? (
                  <span className={FIELD_HINT}>{option.hint}</span>
                ) : null}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {message ? (
        <p
          id={messageId}
          className={cn(
            "mt-1.5 text-caption",
            error ? "text-destructive text-body" : "text-muted-foreground",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
};

const ITEM =
  "border-input bg-card hover:bg-accent has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-ring has-disabled:hover:bg-card flex h-9 min-w-0 cursor-pointer items-center gap-2 rounded-control border px-2.5 text-body select-none has-focus-visible:ring-2 has-disabled:cursor-not-allowed has-disabled:opacity-50";

const BOX =
  "accent-primary size-4 shrink-0 cursor-pointer outline-none disabled:cursor-not-allowed";

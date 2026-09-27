"use client";

import { cn } from "@/lib/utils";

import type { SelectOption } from "./select-field";

interface PropTypes {
  id: string;
  label: string;
  isLabelVisible?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  disabled?: boolean;
}

export const ChoiceField = (props: PropTypes) => {
  const {
    id,
    label,
    isLabelVisible = true,
    value,
    onValueChange,
    options,
    disabled,
  } = props;

  return (
    <div className="@container">
      <fieldset id={id}>
        <legend
          className={cn(
            "mb-1.5 text-body font-medium",
            !isLabelVisible && "sr-only",
          )}
        >
          {label}
        </legend>

        <div className="bg-muted flex w-full gap-0.5 rounded-control p-0.5 @min-[48rem]:w-fit">
          {options.map((option) => (
            <label key={option.value} className={CHOICE}>
              <input
                type="radio"
                name={id}
                value={option.value}
                checked={value === option.value}
                disabled={disabled}
                onChange={() => onValueChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
};

const CHOICE =
  "text-muted-foreground hover:text-foreground has-checked:bg-card has-checked:text-foreground has-focus-visible:ring-ring has-disabled:hover:text-muted-foreground flex h-9 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-[calc(var(--radius-control)-2px)] px-2 text-body font-medium whitespace-nowrap transition-colors select-none has-checked:shadow-sm has-focus-visible:ring-2 has-disabled:cursor-not-allowed has-disabled:opacity-50 @min-[48rem]:flex-none @min-[48rem]:px-4";

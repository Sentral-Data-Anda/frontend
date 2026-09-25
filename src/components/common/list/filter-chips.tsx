"use client";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export type FilterChip = {
  label: string;
  value: string;
};

interface PropTypes {
  options: FilterChip[];
  value: string;
  onPick: (value: string) => void;
  label: string;
  className?: string;
}

export const FilterChips = (props: PropTypes) => {
  const { options, value, onPick, label, className } = props;

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "-mx-gutter flex gap-2 overflow-x-auto px-gutter [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {options.map((option) => {
        const isPicked = option.value === value;

        return (
          <Button
            key={option.value || "semua"}
            type="button"
            size="sm"
            variant={isPicked ? "default" : "outline"}
            aria-pressed={isPicked}
            onClick={() => onPick(option.value)}
            className="rounded-full"
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
};

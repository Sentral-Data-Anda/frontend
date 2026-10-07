"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

interface ListTabOption {
  value: string;
  label: string;
}

interface PropTypes {
  label: string;
  value: string;
  options: readonly ListTabOption[];
  onValueChange: (value: string) => void;
}

const KEY_STEP: Record<string, (index: number, last: number) => number> = {
  ArrowRight: (index, last) => (index >= last ? 0 : index + 1),
  ArrowLeft: (index, last) => (index <= 0 ? last : index - 1),
  Home: () => 0,
  End: (_index, last) => last,
};

export const ListTabs = (props: PropTypes) => {
  const { label, value, options, onValueChange } = props;

  const listRef = useRef<HTMLDivElement>(null);

  const isScrollable = options.length > SCROLL_THRESHOLD;

  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [value]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = KEY_STEP[event.key];
    if (!step || options.length === 0) return;

    event.preventDefault();

    const current = options.findIndex((option) => option.value === value);
    const next = step(current, options.length - 1);
    const option = options[next];
    if (!option) return;

    onValueChange(option.value);
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [next]?.focus();
  };

  return (
    <div className="@container px-gutter pb-3">
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className={cn(
          "bg-muted flex w-full gap-0.5 rounded-control p-0.5 @min-[36rem]:w-fit",
          isScrollable && SCROLL_LIST,
        )}
      >
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onValueChange(option.value)}
              className={cn(
                TAB,
                isScrollable && SCROLL_TAB,
                isSelected ? TAB_SELECTED : TAB_IDLE,
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SCROLL_THRESHOLD = 3;

const SCROLL_LIST =
  "overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden @min-[36rem]:overflow-visible";

const SCROLL_TAB = "flex-none px-3";

const TAB =
  "focus-visible:ring-ring flex h-9 min-w-0 flex-1 items-center justify-center rounded-[calc(var(--radius-control)-2px)] px-2 text-body font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 @min-[36rem]:flex-none @min-[36rem]:px-4";

const TAB_SELECTED = "bg-card text-foreground cursor-default shadow-sm";

const TAB_IDLE = "text-muted-foreground hover:text-foreground cursor-pointer";

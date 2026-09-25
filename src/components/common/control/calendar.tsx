"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useBoolean } from "@/hooks/use-boolean";
import {
  addDays,
  addMonths,
  isSameMonth,
  isWithin,
  monthGrid,
  startOfMonth,
  todayJakarta,
  weekdayIndex,
} from "@/lib/date";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Button } from "./button";

const WEEKDAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const monthTitleFormat = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const monthTitle = (iso: string): string =>
  monthTitleFormat.format(new Date(`${iso.slice(0, 7)}-01T00:00:00.000Z`));

const YEARS_PER_ROW = 4;

interface PropTypes {
  value: string;
  onPick: (iso: string) => void;
  onClose: () => void;
  min?: string;
  max?: string;
  startInYearGrid?: boolean;
  isClearable?: boolean;
  isConfirmVisible?: boolean;
  focusRef?: React.RefObject<HTMLButtonElement | null>;
}

export const Calendar = (props: PropTypes) => {
  const {
    value,
    onPick,
    onClose,
    min,
    max,
    startInYearGrid = false,
    isClearable = false,
    isConfirmVisible = false,
    focusRef,
  } = props;

  const today = todayJakarta();

  const [cursor, setCursor] = useState(() => {
    const start = value || (isWithin(today, min, max) ? today : (min ?? today));

    return start;
  });
  const isYearGrid = useBoolean(startInYearGrid);
  const cursorRef = useRef<HTMLButtonElement>(null);

  const month = startOfMonth(cursor);
  const days = monthGrid(cursor);

  const moveCursor = (next: string) => {
    if (!next || !isWithin(next, min, max)) return;

    setCursor(next);
  };

  const onGridKey = (event: React.KeyboardEvent) => {
    const step: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };

    if (step[event.key] !== undefined) {
      event.preventDefault();
      moveCursor(addDays(cursor, step[event.key]));
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const offset = weekdayIndex(cursor);
      moveCursor(addDays(cursor, event.key === "Home" ? -offset : 6 - offset));
      return;
    }

    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      const direction = event.key === "PageUp" ? -1 : 1;
      moveCursor(
        addMonths(cursor, event.shiftKey ? direction * 12 : direction),
      );
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isWithin(cursor, min, max)) onPick(cursor);
    }
  };

  useEffect(() => {
    let inner = 0;
    // Dua frame: Base UI memindahkan fokus lagi setelah popup terbuka.
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => cursorRef.current?.focus());
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [cursor, isYearGrid.value]);

  if (isYearGrid.value) {
    const firstYear = Number((min ?? "1900-01-01").slice(0, 4));
    const lastYear = Number((max ?? today).slice(0, 4));
    const years = Array.from(
      { length: lastYear - firstYear + 1 },
      (_, index) => lastYear - index,
    );
    const cursorYear = Number(cursor.slice(0, 4));

    const onYear = (year: number) => {
      if (year < firstYear || year > lastYear) return;

      const next = `${year}${cursor.slice(4)}`;
      setCursor(isWithin(next, min, max) ? next : (max ?? min ?? today));
    };

    const onYearKey = (event: React.KeyboardEvent) => {
      const step: Record<string, number> = {
        ArrowLeft: 1,
        ArrowRight: -1,
        ArrowUp: YEARS_PER_ROW,
        ArrowDown: -YEARS_PER_ROW,
        PageUp: YEARS_PER_ROW * 3,
        PageDown: -YEARS_PER_ROW * 3,
      };

      if (step[event.key] !== undefined) {
        event.preventDefault();
        onYear(cursorYear + step[event.key]);
        return;
      }

      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const column = years.indexOf(cursorYear) % YEARS_PER_ROW;
        onYear(
          event.key === "Home"
            ? cursorYear + column
            : cursorYear - (YEARS_PER_ROW - 1 - column),
        );
      }
    };

    return (
      <div className="p-2">
        <p className="mb-2 px-1 text-title font-semibold">Pilih tahun</p>

        <div
          role="grid"
          aria-label="Pilih tahun"
          onKeyDown={onYearKey}
          className="grid max-h-64 grid-cols-4 gap-1 overflow-y-auto overscroll-contain"
          style={{ gridTemplateColumns: `repeat(${YEARS_PER_ROW}, 1fr)` }}
        >
          {years.map((year) => {
            const isCurrent = cursorYear === year;

            return (
              <button
                key={year}
                ref={(node) => {
                  if (isCurrent) cursorRef.current = node;
                }}
                type="button"
                role="gridcell"
                tabIndex={isCurrent ? 0 : -1}
                aria-selected={isCurrent}
                data-autofocus={isCurrent ? "" : undefined}
                onClick={() => {
                  onYear(year);
                  isYearGrid.onFalse();
                }}
                className={cn(
                  "h-control cursor-pointer rounded-control text-body tabular-nums",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent",
                )}
              >
                {year}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="mb-1 flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Bulan sebelumnya"
          className="cursor-pointer"
          onClick={() => moveCursor(addMonths(cursor, -1))}
        >
          <ChevronLeft aria-hidden />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-live="polite"
          className="flex-1 cursor-pointer font-semibold"
          onClick={isYearGrid.onTrue}
        >
          {monthTitle(month)}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Bulan berikutnya"
          className="cursor-pointer"
          onClick={() => moveCursor(addMonths(cursor, 1))}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>

      <div
        role="grid"
        aria-label="Kalender"
        onKeyDown={onGridKey}
        className="grid grid-cols-7 gap-0.5"
      >
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            role="columnheader"
            aria-label={label}
            className="text-muted-foreground flex h-7 items-center justify-center text-caption"
          >
            {label}
          </div>
        ))}

        {days.map((day, index) => {
          const isOutside = !isSameMonth(day, month);
          const isAllowed = isWithin(day, min, max);
          const isSelected = day === value;
          const isCursor = day === cursor;

          return (
            <button
              // Kunci posisi: kunci tanggal membuang sel yang sedang difokus.
              key={index}
              ref={(node) => {
                if (!isCursor) return;

                cursorRef.current = node;
                if (focusRef) focusRef.current = node;
              }}
              data-autofocus={isCursor ? "" : undefined}
              type="button"
              role="gridcell"
              tabIndex={isCursor ? 0 : -1}
              disabled={!isAllowed}
              aria-label={formatDate(day)}
              aria-selected={isSelected}
              aria-current={day === today ? "date" : undefined}
              onClick={() => onPick(day)}
              className={cn(
                "flex h-9 w-full items-center justify-center rounded-control text-body tabular-nums transition-colors",
                "cursor-pointer focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
                !isSelected && "hover:bg-accent",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
                isOutside && "text-muted-foreground",
                day === today &&
                  !isSelected &&
                  "relative font-semibold after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-primary",
                isSelected && "bg-primary text-primary-foreground",
              )}
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={!isWithin(today, min, max)}
          onClick={() => onPick(today)}
        >
          Hari ini
        </Button>

        {isClearable ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => onPick("")}
          >
            Hapus
          </Button>
        ) : null}

        {isConfirmVisible ? (
          <Button
            type="button"
            size="sm"
            className="ml-auto cursor-pointer"
            onClick={onClose}
          >
            Pilih
          </Button>
        ) : null}
      </div>
    </div>
  );
};

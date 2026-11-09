"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useHolidayCalendar } from "@/hooks/use-holiday-calendar";
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

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const monthTitleFormat = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const monthTitle = (iso: string): string =>
  monthTitleFormat.format(new Date(`${iso.slice(0, 7)}-01T00:00:00.000Z`));

const YEARS_PER_ROW = 4;
const MONTHS_PER_ROW = 3;

type CalendarView = "day" | "month" | "year";

const pad = (value: number, length: number): string =>
  String(value).padStart(length, "0");

const lastDayOfMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

const toCursor = (iso: string, year: number, month: number): string => {
  const day = Math.min(Number(iso.slice(8)), lastDayOfMonth(year, month));

  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
};

const clamp = (iso: string, min?: string, max?: string): string => {
  if (min && iso < min) return min;
  if (max && iso > max) return max;

  return iso;
};

const isMonthWithin = (
  year: number,
  month: number,
  min?: string,
  max?: string,
): boolean => {
  const first = `${pad(year, 4)}-${pad(month, 2)}-01`;
  const last = `${pad(year, 4)}-${pad(month, 2)}-${lastDayOfMonth(year, month)}`;

  return (!min || last >= min) && (!max || first <= max);
};

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
  const [view, setView] = useState<CalendarView>(
    startInYearGrid ? "year" : "day",
  );
  const cursorRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const month = startOfMonth(cursor);
  const days = monthGrid(cursor);
  const holidays = useHolidayCalendar(days[0] ?? "", days.at(-1) ?? "");
  const cursorYear = Number(cursor.slice(0, 4));
  const cursorMonth = Number(cursor.slice(5, 7));

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

  const setCursorNode = (node: HTMLButtonElement | null) => {
    cursorRef.current = node;
    if (focusRef) focusRef.current = node;
  };

  useEffect(() => {
    if (view === "day") return;

    const onPointerDown = (event: PointerEvent) => {
      if (!overlayRef.current?.contains(event.target as Node)) {
        setView("day");
      }
    };

    document.addEventListener("pointerdown", onPointerDown);

    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [view]);

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
  }, [cursor, view]);

  if (view === "year") {
    const firstYear = Number((min ?? "1900-01-01").slice(0, 4));
    const lastYear = Number((max ?? today).slice(0, 4));
    const years = Array.from(
      { length: lastYear - firstYear + 1 },
      (_, index) => lastYear - index,
    );

    const onYear = (year: number) => {
      if (year < firstYear || year > lastYear) return;

      setCursor(clamp(toCursor(cursor, year, cursorMonth), min, max));
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

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setView("day");
        return;
      }

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
      <div ref={overlayRef} className="p-2">
        <div className="mb-2 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Kembali ke kalender"
            className="cursor-pointer"
            onClick={() => setView("day")}
          >
            <ChevronLeft aria-hidden />
          </Button>

          <p className="px-1 text-title font-semibold">Pilih tahun</p>
        </div>

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
                  setView("month");
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

  if (view === "month") {
    const onMonth = (nextMonth: number) => {
      if (nextMonth < 1 || nextMonth > 12) return;
      if (!isMonthWithin(cursorYear, nextMonth, min, max)) return;

      setCursor(clamp(toCursor(cursor, cursorYear, nextMonth), min, max));
    };

    const onMonthKey = (event: React.KeyboardEvent) => {
      const step: Record<string, number> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -MONTHS_PER_ROW,
        ArrowDown: MONTHS_PER_ROW,
      };

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setView("day");
        return;
      }

      if (step[event.key] !== undefined) {
        event.preventDefault();
        onMonth(cursorMonth + step[event.key]);
        return;
      }

      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const column = (cursorMonth - 1) % MONTHS_PER_ROW;
        onMonth(
          event.key === "Home"
            ? cursorMonth - column
            : cursorMonth + (MONTHS_PER_ROW - 1 - column),
        );
      }
    };

    return (
      <div ref={overlayRef} className="p-2">
        <div className="mb-2 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Kembali ke kalender"
            className="cursor-pointer"
            onClick={() => setView("day")}
          >
            <ChevronLeft aria-hidden />
          </Button>

          <p className="px-1 text-title font-semibold">Pilih bulan</p>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Pilih tahun"
            className="ml-auto cursor-pointer font-semibold tabular-nums"
            onClick={() => setView("year")}
          >
            {cursorYear}
          </Button>
        </div>

        <div
          role="grid"
          aria-label="Pilih bulan"
          onKeyDown={onMonthKey}
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${MONTHS_PER_ROW}, 1fr)` }}
        >
          {MONTH_LABELS.map((label, index) => {
            const monthNumber = index + 1;
            const isCurrent = cursorMonth === monthNumber;
            const isAllowed = isMonthWithin(cursorYear, monthNumber, min, max);

            return (
              <button
                key={label}
                ref={(node) => {
                  if (isCurrent) cursorRef.current = node;
                }}
                type="button"
                role="gridcell"
                tabIndex={isCurrent ? 0 : -1}
                disabled={!isAllowed}
                aria-label={`${MONTH_NAMES[index]} ${cursorYear}`}
                aria-selected={isCurrent}
                data-autofocus={isCurrent ? "" : undefined}
                onClick={() => {
                  onMonth(monthNumber);
                  setView("day");
                }}
                className={cn(
                  "h-control cursor-pointer rounded-control text-body",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
                  "disabled:text-muted-foreground disabled:cursor-not-allowed disabled:line-through",
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent",
                )}
              >
                {label}
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
          onClick={() => setView("year")}
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
          const isToday = day === today;
          const holiday = holidays.get(day);

          return (
            <button
              // Kunci posisi: kunci tanggal membuang sel yang sedang difokus.
              key={index}
              ref={isCursor ? setCursorNode : undefined}
              data-autofocus={isCursor ? "" : undefined}
              type="button"
              role="gridcell"
              tabIndex={isCursor ? 0 : -1}
              disabled={!isAllowed}
              aria-label={
                holiday
                  ? `${formatDate(day)}, libur: ${holiday}`
                  : formatDate(day)
              }
              title={holiday}
              aria-selected={isSelected}
              aria-current={isToday ? "date" : undefined}
              data-outside={isOutside || undefined}
              data-today={isToday || undefined}
              data-holiday={holiday ? "" : undefined}
              onClick={() => onPick(day)}
              className={cn(
                "relative flex h-9 w-full items-center justify-center rounded-control text-body tabular-nums transition-colors",
                "cursor-pointer focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:line-through",
                isToday &&
                  "font-semibold after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-current",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && isAllowed && "hover:bg-accent",
                !isSelected && !isAllowed && "text-muted-foreground",
                !isSelected && isOutside && "text-muted-foreground/70",
                !isSelected &&
                  isToday &&
                  "bg-secondary text-secondary-foreground",
                holiday &&
                  "before:absolute before:bottom-1 before:size-1 before:rounded-full before:bg-destructive",
                holiday &&
                  isToday &&
                  "before:translate-x-1 after:-translate-x-1",
                holiday &&
                  isSelected &&
                  "before:ring-1 before:ring-primary-foreground",
                holiday && isOutside && !isSelected && "before:opacity-70",
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

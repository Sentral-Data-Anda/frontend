"use client";

import { type KpiDelta } from "@/components/common/dashboard";

import { useSurplusDefisit } from "../../api";
import { monthOf, toDateKey } from "../../model";

const MONTH_SHORT = [
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

const periodFormat = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const useRanges = () => {
  const today = toDateKey(new Date());
  const [year, month, day] = today.split("-");
  const lastYear = String(Number(year) - 1);

  return {
    today,
    year,
    monthStart: `${year}-${month}-01`,
    yearStart: `${year}-01-01`,
    lastYearFrom: `${lastYear}-${month}-01`,
    lastYearTo: `${lastYear}-${month}-${day}`,
    monthLabel: `${MONTH_SHORT[Number(month) - 1]} ${lastYear}`,
    periodLabel: periodFormat.format(new Date(`${year}-${month}-01T00:00:00Z`)),
    untilLabel: `Jan–${MONTH_SHORT[monthOf(new Date()) - 1]} ${year}`,
  };
};

export function useMonthFlow() {
  const ranges = useRanges();
  const thisYear = useSurplusDefisit(ranges.monthStart, ranges.today);
  const lastYear = useSurplusDefisit(ranges.lastYearFrom, ranges.lastYearTo);
  const previous = lastYear.data;
  const isComparable =
    previous !== undefined && previous.income + previous.expense > 0;

  const deltaOf = (
    now: number | undefined,
    before: number,
    isUpGood: boolean,
  ): KpiDelta | null => {
    if (!isComparable || now === undefined || before <= 0) return null;
    const percent = ((now - before) / before) * 100;

    return Math.round(Math.abs(percent)) === 0
      ? null
      : { percent, label: `vs ${ranges.monthLabel}`, isUpGood };
  };

  return { ranges, query: thisYear, previous, deltaOf };
}

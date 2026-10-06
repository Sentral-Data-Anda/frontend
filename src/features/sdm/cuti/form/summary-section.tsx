"use client";

import { useWatch } from "react-hook-form";

import { DescriptionItem, DescriptionList } from "@/components/common/display";
import { FormSection, FormWide } from "@/components/common/form";
import { formatDays } from "@/lib/format";

import { useRemainingQuota } from "../api";
import {
  ALL_HOLIDAY_MESSAGE,
  QUOTA_PENDING_NOTE,
  WEEKLY_OFF_NOTE,
  calendarDaysOf,
  chargedYearOf,
  holidayNamesOf,
  holidaysWithin,
  isAllHoliday,
  maxWorkingDaysOf,
  quotaSpentTextOf,
  quotaTextOf,
} from "../model";
import type { HolidayDay } from "../types";

import type { CutiForm } from "./form-options";

interface PropTypes {
  form: CutiForm;
  holidays: readonly HolidayDay[];
  isLoadingHolidays: boolean;
}

export const SummarySection = (props: PropTypes) => {
  const { form, holidays, isLoadingHolidays } = props;

  const karyawanId = useWatch({ control: form.control, name: "karyawanId" });
  const leaveTypeId = useWatch({ control: form.control, name: "leaveTypeId" });
  const startDate = useWatch({ control: form.control, name: "startDate" });
  const endDate = useWatch({ control: form.control, name: "endDate" });
  const length = useWatch({ control: form.control, name: "length" });
  const quota = useRemainingQuota(
    karyawanId,
    leaveTypeId,
    chargedYearOf(startDate),
  );
  const calendarDays = calendarDaysOf(startDate, endDate);
  const holidayCount = holidaysWithin(holidays, startDate, endDate).length;
  const maxDays = maxWorkingDaysOf(
    startDate,
    endDate,
    holidays,
    length === "setengah",
  );
  const isBlocked = isAllHoliday(startDate, endDate, holidays);

  return (
    <FormSection legend="Ringkasan" note={WEEKLY_OFF_NOTE}>
      <FormWide>
        <DescriptionList>
          <DescriptionItem label="Rentang">
            {calendarDays > 0 ? formatDays(calendarDays) : "Pilih tanggal"}
          </DescriptionItem>

          <DescriptionItem label="Hari libur dalam rentang" isWide>
            {isLoadingHolidays
              ? "Memuat…"
              : calendarDays === 0
                ? "—"
                : holidayCount === 0
                  ? "Tidak ada"
                  : holidayNamesOf(holidays, startDate, endDate)}
          </DescriptionItem>

          <DescriptionItem label="Paling banyak">
            {calendarDays > 0 && !isLoadingHolidays ? formatDays(maxDays) : "—"}
          </DescriptionItem>

          <DescriptionItem label="Sisa jatah">
            {quota.isLoading
              ? "Memuat…"
              : quota.data
                ? quotaTextOf(quota.data)
                : "Pilih karyawan dan tipe cuti"}
          </DescriptionItem>
        </DescriptionList>

        {quota.data ? (
          <p className="text-muted-foreground mt-2 text-caption">
            {quotaSpentTextOf(quota.data)}. {QUOTA_PENDING_NOTE}
          </p>
        ) : null}

        {isBlocked ? (
          <p className="text-destructive mt-2 text-caption" role="alert">
            {ALL_HOLIDAY_MESSAGE}
          </p>
        ) : null}
      </FormWide>
    </FormSection>
  );
};

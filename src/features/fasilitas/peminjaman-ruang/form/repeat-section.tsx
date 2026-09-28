"use client";

import type { ReactNode } from "react";
import { Controller, useWatch } from "react-hook-form";

import {
  CheckboxGroupField,
  ChoiceField,
  DateField,
  optionsOf,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { endOfYearIso, weekdayIndex } from "@/lib/date";
import { formatDate, formatTimeRange } from "@/lib/format";

import { REPEAT_MAX, repeatDatesOf } from "../model";
import { WEEKDAY_LABEL, type RepeatMode } from "../types";

import { REPEAT_OPTIONS, type LoanForm } from "./form-options";

interface PropTypes {
  form: LoanForm;
  isDisabled: boolean;
  children: ReactNode;
}

const WEEKDAY_OPTIONS = optionsOf(WEEKDAY_LABEL);

const joinDays = (names: string[]) =>
  names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} dan ${names.at(-1)}`;

export const RepeatSection = (props: PropTypes) => {
  const { form, isDisabled, children } = props;

  const [repeat, date, until, startTime, endTime, weekdays] = useWatch({
    control: form.control,
    name: ["repeat", "date", "until", "startTime", "endTime", "weekdays"],
  });
  const isWeekly = repeat === "WEEKLY";
  const dateMax = endOfYearIso(1);
  const count = repeatDatesOf({ repeat, date, until, weekdays }).length;
  const dayNames = WEEKDAY_OPTIONS.filter((option) =>
    weekdays.includes(option.value),
  ).map((option) => option.label);
  const summary =
    date && until && startTime && endTime && until > date && dayNames.length
      ? `Tiap ${joinDays(dayNames)}, pukul ${formatTimeRange(startTime, endTime)}, ${formatDate(date)} s.d. ${formatDate(until)} · ${Math.min(count, REPEAT_MAX)} kali${count > REPEAT_MAX ? ` (maks. ${REPEAT_MAX})` : ""}.`
      : "Pilih hari, lalu isi tanggal mulai, tanggal akhir, dan jam di atas.";

  const onPickRepeat = (value: string) => {
    form.setValue("repeat", value as RepeatMode, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });
    if (value !== "WEEKLY" || weekdays.length || !date) return;
    form.setValue("weekdays", [String(weekdayIndex(date))], {
      shouldDirty: true,
    });
  };

  return (
    <FormSection legend="Ulangi" disabled={isDisabled}>
      <ChoiceField
        id="repeat"
        label="Ulangi"
        isLabelVisible={false}
        value={repeat}
        onValueChange={onPickRepeat}
        options={REPEAT_OPTIONS}
        disabled={isDisabled}
      />

      {isWeekly ? (
        <FormWide>
          <Controller
            control={form.control}
            name="weekdays"
            render={({ field, fieldState }) => (
              <CheckboxGroupField
                id="weekdays"
                label="Hari"
                value={field.value}
                onValueChange={field.onChange}
                options={WEEKDAY_OPTIONS}
                error={fieldState.error?.message}
                hint="Bisa lebih dari satu, mis. Selasa dan Kamis."
                disabled={isDisabled}
              />
            )}
          />
        </FormWide>
      ) : null}

      {isWeekly ? (
        <ControlField
          control={form.control}
          name="until"
          label="Sampai tanggal"
        >
          {(field) => (
            <DateField
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isDisabled}
              variant="dekat"
              min={date || undefined}
              max={dateMax}
              label="Sampai tanggal"
              hint={`Paling banyak ${REPEAT_MAX} tanggal.`}
            />
          )}
        </ControlField>
      ) : null}

      {isWeekly ? (
        <FormWide>
          <p role="status" className="text-body text-foreground font-medium">
            {summary}
          </p>
        </FormWide>
      ) : null}

      {isWeekly ? <FormWide>{children}</FormWide> : null}
    </FormSection>
  );
};

"use client";

import type { ReactNode } from "react";
import { useWatch } from "react-hook-form";

import { ChoiceField, DateField } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { endOfYearIso, weeklyDates } from "@/lib/date";
import { formatDate, formatTimeRange, formatWeekday } from "@/lib/format";

import { REPEAT_MAX } from "../model";
import type { RepeatMode } from "../types";

import { REPEAT_OPTIONS, type LoanForm } from "./form-options";

interface PropTypes {
  form: LoanForm;
  isDisabled: boolean;
  children: ReactNode;
}

export const RepeatSection = (props: PropTypes) => {
  const { form, isDisabled, children } = props;

  const [repeat, date, until, startTime, endTime] = useWatch({
    control: form.control,
    name: ["repeat", "date", "until", "startTime", "endTime"],
  });
  const isWeekly = repeat === "WEEKLY";
  const dateMax = endOfYearIso(1);
  const count =
    date && until ? weeklyDates(date, until, REPEAT_MAX + 1).length : 0;
  const summary =
    date && until && startTime && endTime && until >= date
      ? `Tiap ${formatWeekday(date)}, pukul ${formatTimeRange(startTime, endTime)}, ${formatDate(date)} s.d. ${formatDate(until)} · ${Math.min(count, REPEAT_MAX)} kali${count > REPEAT_MAX ? ` (maks. ${REPEAT_MAX})` : ""}.`
      : "Hari pengulangan mengikuti Tanggal mulai, jamnya mengikuti Jam mulai dan Jam selesai di atas.";

  const onPickRepeat = (value: string) =>
    form.setValue("repeat", value as RepeatMode, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });

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

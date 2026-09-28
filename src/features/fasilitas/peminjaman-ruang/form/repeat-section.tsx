"use client";

import type { ReactNode } from "react";
import { useWatch } from "react-hook-form";

import { ChoiceField, DateField } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { endOfYearIso } from "@/lib/date";
import { formatWeekday } from "@/lib/format";

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

  const [repeat, date] = useWatch({
    control: form.control,
    name: ["repeat", "date"],
  });
  const isWeekly = repeat === "WEEKLY";
  const dateMax = endOfYearIso(1);
  const untilHint = `Tiap ${date ? formatWeekday(date) : "minggu"}, paling banyak ${REPEAT_MAX} tanggal.`;

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
              hint={untilHint}
            />
          )}
        </ControlField>
      ) : null}

      {isWeekly ? <FormWide>{children}</FormWide> : null}
    </FormSection>
  );
};

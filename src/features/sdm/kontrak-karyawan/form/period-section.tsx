"use client";

import { Controller, useWatch } from "react-hook-form";

import { CheckboxGroupField, DateField } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { endOfYearIso } from "@/lib/date";

import {
  PERIOD_NOTE,
  WEEKLY_DAY_OFF_HINT,
  WEEKLY_DAY_OFF_MISSING,
} from "../model";
import { WEEKDAY_OPTIONS, type KontrakKaryawan } from "../types";

import { type KontrakForm } from "./form-options";

// Kontrak dan penetapan komponen boleh mulai NANTI — `contractPhase` punya
// status UPCOMING untuk itu — jadi `max` bawaan `DateField` (hari ini) akan
// menolak setiap periode yang belum berjalan.
const PERIOD_MAX = endOfYearIso(5);

interface PropTypes {
  form: KontrakForm;
  isDisabled: boolean;
  contract?: KontrakKaryawan;
}

export const PeriodSection = (props: PropTypes) => {
  const { form, isDisabled, contract } = props;

  const effectiveFrom = useWatch({
    control: form.control,
    name: "effectiveFrom",
  });
  const isDayOffMissing = contract?.weeklyDayOff.length === 0;

  return (
    <FormSection
      legend="Masa berlaku dan libur"
      note={PERIOD_NOTE}
      disabled={isDisabled}
    >
      <ControlField
        control={form.control}
        name="effectiveFrom"
        label="Berlaku dari"
      >
        {(field) => (
          <DateField
            id={field.name}
            label="Berlaku dari"
            max={PERIOD_MAX}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            isClearable={false}
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="effectiveTo"
        label="Berlaku sampai"
        isOptional
      >
        {(field) => (
          <DateField
            id={field.name}
            label="Berlaku sampai"
            hint="Kosongkan bila berlaku terus, atau ketik dd/mm/yyyy."
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            min={effectiveFrom || undefined}
            max={PERIOD_MAX}
          />
        )}
      </ControlField>

      <FormWide>
        <Controller
          control={form.control}
          name="weeklyDayOff"
          render={({ field, fieldState }) => (
            <CheckboxGroupField
              id="weeklyDayOff"
              label="Libur mingguan"
              value={field.value}
              onValueChange={field.onChange}
              options={WEEKDAY_OPTIONS}
              error={fieldState.error?.message}
              hint={
                isDayOffMissing ? WEEKLY_DAY_OFF_MISSING : WEEKLY_DAY_OFF_HINT
              }
              disabled={isDisabled}
            />
          )}
        />
      </FormWide>
    </FormSection>
  );
};

"use client";

import {
  DateField,
  Input,
  SelectField,
  optionsOf,
} from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { RECURRING_HINT, holidayDateMax } from "../model";
import { HOLIDAY_TYPE_LABEL } from "../types";

import { type HolidayForm } from "./form-options";

const TYPE_OPTIONS = optionsOf(HOLIDAY_TYPE_LABEL);

const DATE_MAX = holidayDateMax();

const RECURRING_OPTIONS = [
  { value: "true", label: "Ya" },
  { value: "false", label: "Tidak" },
];

interface PropTypes {
  form: HolidayForm;
  isDisabled: boolean;
}

export const HolidaySection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Hari libur" disabled={isDisabled}>
      <ControlField control={form.control} name="date" label="Tanggal">
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            max={DATE_MAX}
            label="Tanggal hari libur"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="name"
        label="Nama"
        hint="3–100 karakter, mis. HUT Gereja."
      >
        {(field) => <Input {...field} maxLength={100} autoCapitalize="words" />}
      </ControlField>

      <ControlField control={form.control} name="type" label="Tipe">
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={TYPE_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih tipe"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="isRecurring"
        label="Berulang tiap tahun"
        hint={RECURRING_HINT}
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={RECURRING_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih berulang tiap tahun"
          />
        )}
      </ControlField>
    </FormSection>
  );
};

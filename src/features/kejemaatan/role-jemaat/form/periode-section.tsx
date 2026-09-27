"use client";

import { DateField, SelectField, optionsOf } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { endOfYearIso } from "@/lib/date";

import { ROLE_STATUS_LABEL } from "../types";

import { type RoleJemaatForm } from "./form-options";

const STATUS_OPTIONS = optionsOf(ROLE_STATUS_LABEL);

const DATE_MAX = endOfYearIso(5);

interface PropTypes {
  form: RoleJemaatForm;
  isDisabled: boolean;
}

export const PeriodeSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Periode" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="startPeriode"
        label="Tanggal mulai"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={field.disabled}
            max={DATE_MAX}
            label="Tanggal mulai"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="endPeriode"
        label="Tanggal selesai"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={field.disabled}
            max={DATE_MAX}
            label="Tanggal selesai"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="status" label="Status">
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={STATUS_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih status"
          />
        )}
      </ControlField>
    </FormSection>
  );
};

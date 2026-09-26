"use client";

import { DateField, SelectField, optionsOf } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { ROLE_STATUS_LABEL } from "../types";

import { type RoleJemaatForm } from "./form-options";

const STATUS_OPTIONS = optionsOf(ROLE_STATUS_LABEL);

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

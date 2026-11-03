"use client";

import { DateField } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { endOfYearIso } from "@/lib/date";

import { type RoleJemaatForm } from "./form-options";

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
        isRequired
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
        isRequired
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
    </FormSection>
  );
};

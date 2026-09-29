"use client";

import { SelectField } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { periodOptions } from "../model";

import { type RunForm } from "./form-options";

interface PropTypes {
  form: RunForm;
  isDisabled: boolean;
}

export const PeriodSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection
      legend="Periode"
      note="Periode harus berurutan: posting periode sebelumnya dulu."
      disabled={isDisabled}
    >
      <ControlField control={form.control} name="period" label="Periode">
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={periodOptions()}
            disabled={isDisabled}
            placeholder="Pilih periode"
          />
        )}
      </ControlField>
    </FormSection>
  );
};

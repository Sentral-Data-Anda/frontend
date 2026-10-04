"use client";

import {
  AmountInput,
  BapelField,
  SelectField,
  type SelectOption,
} from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { AMOUNT_HINT, FORM_NOTE } from "../model";

import { type AllocationForm } from "./form-options";

interface PropTypes {
  form: AllocationForm;
  yearOptions: readonly SelectOption[];
  isDisabled: boolean;
}

export const CeilingSection = (props: PropTypes) => {
  const { form, yearOptions, isDisabled } = props;

  return (
    <FormSection legend="Pagu" note={FORM_NOTE} disabled={isDisabled}>
      <ControlField control={form.control} name="bapelId" label="Komisi">
        {(field) => (
          <BapelField
            id={field.name}
            value={field.value}
            onValueChange={field.onChange}
            disabled={isDisabled}
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="year" label="Tahun pelayanan">
        {(field) => (
          <SelectField
            id={field.name}
            value={field.value}
            onValueChange={field.onChange}
            options={yearOptions}
            disabled={isDisabled}
            placeholder="Pilih tahun pelayanan"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="amount"
        label="Pagu (Rp)"
        hint={AMOUNT_HINT}
      >
        {(field) => (
          <AmountInput
            id={field.name}
            ref={field.ref}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            maxDigits={13}
            maxFraction={2}
          />
        )}
      </ControlField>
    </FormSection>
  );
};

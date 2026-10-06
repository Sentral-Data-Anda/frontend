"use client";

import {
  AmountInput,
  Input,
  SelectField,
  Textarea,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";

import { MAX_SALARY_DIGITS, MAX_SALARY_FRACTION } from "../model";
import { CONTRACT_TYPE_OPTIONS } from "../types";

import { type KontrakForm } from "./form-options";

interface PropTypes {
  form: KontrakForm;
  isDisabled: boolean;
}

export const JobSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Pekerjaan" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="contractType"
        label="Jenis kontrak"
      >
        {(field) => (
          <SelectField
            id={field.name}
            value={field.value}
            onValueChange={field.onChange}
            options={CONTRACT_TYPE_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih jenis kontrak"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="position"
        label="Jabatan"
        hint="Mis. Koster, Admin Kantor."
      >
        {(field) => <Input {...field} maxLength={100} autoCapitalize="words" />}
      </ControlField>

      <ControlField
        control={form.control}
        name="basicSalary"
        label="Gaji pokok (Rp)"
        hint="Gaji bulanan sebelum tunjangan dan potongan."
      >
        {(field) => (
          <AmountInput
            id={field.name}
            ref={field.ref}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            maxDigits={MAX_SALARY_DIGITS}
            maxFraction={MAX_SALARY_FRACTION}
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField
          control={form.control}
          name="note"
          label="Catatan"
          isOptional
        >
          {(field) => <Textarea {...field} rows={2} maxLength={250} />}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};

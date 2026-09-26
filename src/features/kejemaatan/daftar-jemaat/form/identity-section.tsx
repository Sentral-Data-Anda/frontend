"use client";

import {
  DateField,
  Input,
  SelectField,
  optionsOf,
} from "@/components/common/control";
import { FormSection, ControlField } from "@/components/common/form";

import { GENDER_LABEL } from "../types";

import { type JemaatForm } from "./form-options";

const GENDER_OPTIONS = optionsOf(GENDER_LABEL);

interface PropTypes {
  form: JemaatForm;
  isDisabled: boolean;
}

export const IdentitySection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Identitas" disabled={isDisabled}>
      <ControlField control={form.control} name="name" label="Nama lengkap">
        {(field) => (
          <Input {...field} autoComplete="name" autoCapitalize="words" />
        )}
      </ControlField>

      <ControlField control={form.control} name="gender" label="Jenis kelamin">
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={GENDER_OPTIONS}
            // Popup Base UI ada di portal, di luar fieldset, jadi disabled diteruskan sendiri.
            disabled={isDisabled}
            placeholder="Pilih jenis kelamin"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="birthPlace"
        label="Tempat lahir"
      >
        {(field) => <Input {...field} maxLength={25} />}
      </ControlField>

      <ControlField
        control={form.control}
        name="birthDate"
        label="Tanggal lahir"
        isOptional
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={field.disabled}
            variant="lahir"
            label="Tanggal lahir"
          />
        )}
      </ControlField>
    </FormSection>
  );
};

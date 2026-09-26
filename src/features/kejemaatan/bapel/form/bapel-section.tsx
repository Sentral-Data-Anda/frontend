"use client";

import { Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { type BapelForm } from "./form-options";

interface PropTypes {
  form: BapelForm;
  isDisabled: boolean;
}

export const BapelSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Badan pelayanan" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="name"
        label="Nama"
        hint="4–25 karakter, mis. Komisi Pemuda."
      >
        {(field) => <Input {...field} maxLength={25} autoCapitalize="words" />}
      </ControlField>
    </FormSection>
  );
};

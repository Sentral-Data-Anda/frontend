"use client";

import { Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { type SatuanForm } from "./form-options";

interface PropTypes {
  form: SatuanForm;
  isDisabled: boolean;
}

export const SatuanSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Satuan" disabled={isDisabled}>
      <ControlField control={form.control} name="name" label="Nama">
        {(field) => (
          <Input
            {...field}
            maxLength={30}
            autoCapitalize="words"
            placeholder="mis. Pak"
          />
        )}
      </ControlField>
    </FormSection>
  );
};

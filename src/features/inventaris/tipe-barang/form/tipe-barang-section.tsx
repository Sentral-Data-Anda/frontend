"use client";

import { Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { type TipeBarangForm } from "./form-options";

interface PropTypes {
  form: TipeBarangForm;
  isDisabled: boolean;
}

export const TipeBarangSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Tipe barang" disabled={isDisabled}>
      <ControlField control={form.control} name="name" label="Nama">
        {(field) => (
          <Input
            {...field}
            maxLength={50}
            autoCapitalize="words"
            placeholder="mis. Alat Musik"
          />
        )}
      </ControlField>
    </FormSection>
  );
};

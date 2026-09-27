"use client";

import { ComboboxField } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { useUnregisteredJemaatOptions } from "../api";

import { type UserForm } from "./form-options";

interface PropTypes {
  form: UserForm;
  isDisabled: boolean;
}

export const JemaatSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const jemaat = useUnregisteredJemaatOptions();

  return (
    <FormSection legend="Pemilik akun" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="jemaatId"
        label="Jemaat"
        hint="Hanya jemaat yang belum punya akun. Username = kode induk."
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={jemaat.options}
            isLoading={jemaat.isLoading}
            onSearch={jemaat.onSearch}
            disabled={isDisabled}
            placeholder="Ketik nama jemaat"
            emptyMessage="Tidak ada jemaat tanpa akun dengan nama itu"
          />
        )}
      </ControlField>
    </FormSection>
  );
};

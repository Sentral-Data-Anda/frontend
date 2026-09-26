"use client";

import { Input, SelectField, optionsOf } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { WILAYAH_STATUS_LABEL } from "../types";

import { type WilayahForm } from "./form-options";

const STATUS_OPTIONS = optionsOf(WILAYAH_STATUS_LABEL);

interface PropTypes {
  form: WilayahForm;
  isDisabled: boolean;
}

export const WilayahSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Wilayah" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="name"
        label="Nama"
        hint="Maksimal 50 karakter, mis. Wilayah I."
      >
        {(field) => <Input {...field} maxLength={50} autoCapitalize="words" />}
      </ControlField>

      <ControlField
        control={form.control}
        name="isActive"
        label="Status"
        hint="Wilayah nonaktif tidak bisa dipilih untuk jemaat atau keluarga baru; data lama tetap memakainya."
      >
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

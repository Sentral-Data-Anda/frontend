"use client";

import {
  ComboboxField,
  Input,
  SelectField,
  optionsOf,
} from "@/components/common/control";
import { FormSection, ControlField } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { WORSHIPS_HERE_LABEL } from "../model";

import { type KeluargaForm } from "./form-options";

const WORSHIPS_HERE_OPTIONS = optionsOf(WORSHIPS_HERE_LABEL);

interface PropTypes {
  form: KeluargaForm;
  isDisabled: boolean;
}

export const KeluargaSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const zoneChurch = useDdlOptions("zone-church");

  return (
    <FormSection legend="Keluarga" disabled={isDisabled}>
      <ControlField control={form.control} name="name" label="Nama keluarga">
        {(field) => <Input {...field} maxLength={100} autoCapitalize="words" />}
      </ControlField>

      <ControlField
        control={form.control}
        name="zoneChurchId"
        label="Wilayah"
        isOptional
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={zoneChurch.options}
            isLoading={zoneChurch.isLoading}
            isClearable
            disabled={isDisabled}
            placeholder="Pilih wilayah"
            emptyMessage="Belum ada data wilayah"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="worshipsHere"
        label="Beribadah di sini"
        hint="Pilih Tidak bila keluarga ini beribadah di gereja lain."
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={WORSHIPS_HERE_OPTIONS}
            disabled={isDisabled}
          />
        )}
      </ControlField>
    </FormSection>
  );
};

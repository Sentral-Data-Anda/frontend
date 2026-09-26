"use client";

import { ComboboxField } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { useJemaatOptions } from "../api";
import type { RiwayatJemaat } from "../types";

import type { RiwayatForm } from "./form-options";

interface PropTypes {
  form: RiwayatForm;
  isDisabled: boolean;
  savedJemaat?: RiwayatJemaat["jemaat"];
}

export const JemaatSection = (props: PropTypes) => {
  const { form, isDisabled, savedJemaat } = props;

  const jemaat = useJemaatOptions();

  // Jemaat tersimpan belum tentu masuk 20 hasil pertama pencarian.
  const options =
    savedJemaat &&
    !jemaat.options.some((option) => option.value === savedJemaat.code)
      ? [
          { value: savedJemaat.code, label: savedJemaat.name },
          ...jemaat.options,
        ]
      : jemaat.options;

  return (
    <FormSection legend="Jemaat" disabled={isDisabled}>
      <ControlField control={form.control} name="jemaatCode" label="Jemaat">
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={options}
            isLoading={jemaat.isLoading}
            onSearch={jemaat.onSearch}
            disabled={isDisabled}
            placeholder="Ketik nama jemaat"
            emptyMessage="Jemaat tidak ditemukan"
          />
        )}
      </ControlField>
    </FormSection>
  );
};

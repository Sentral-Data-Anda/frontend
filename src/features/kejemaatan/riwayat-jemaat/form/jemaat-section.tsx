"use client";

import { ComboboxField, type SelectOption } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { useJemaatOptions } from "../api";

import type { RiwayatForm } from "./form-options";

interface PropTypes {
  form: RiwayatForm;
  isDisabled: boolean;
  pinned: SelectOption | null;
}

export const JemaatSection = (props: PropTypes) => {
  const { form, isDisabled, pinned } = props;

  const jemaat = useJemaatOptions(pinned);

  return (
    <FormSection legend="Jemaat" disabled={isDisabled}>
      <ControlField control={form.control} name="jemaatCode" label="Jemaat">
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={jemaat.options}
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

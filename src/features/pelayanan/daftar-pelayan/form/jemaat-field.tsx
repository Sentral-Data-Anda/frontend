"use client";

import { ComboboxField } from "@/components/common/control";
import { ControlField } from "@/components/common/form";

import { useActiveJemaatSearch } from "../api";

import { type PelayanForm } from "./form-options";

interface PropTypes {
  form: PelayanForm;
  isDisabled: boolean;
}

export const JemaatField = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const jemaat = useActiveJemaatSearch();

  return (
    <ControlField
      control={form.control}
      name="jemaatId"
      label="Jemaat"
      hint="Hanya jemaat aktif yang bisa melayani."
    >
      {(field) => (
        <ComboboxField
          value={field.value}
          onValueChange={field.onChange}
          options={jemaat.options}
          isLoading={jemaat.isLoading}
          onSearch={jemaat.onSearch}
          isClearable
          disabled={isDisabled}
          placeholder="Pilih jemaat"
          emptyMessage="Tidak ada jemaat aktif dengan nama itu"
        />
      )}
    </ControlField>
  );
};

"use client";

import {
  ComboboxField,
  Input,
  type SelectOption,
} from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { useJemaatOptions } from "../api";

import { type MarriageForm } from "./form-options";

const LEGEND = { husband: "Suami", wife: "Istri" } as const;

interface PropTypes {
  form: MarriageForm;
  side: "husband" | "wife";
  current?: SelectOption;
  isDisabled: boolean;
}

export const PartySection = (props: PropTypes) => {
  const { form, side, current, isDisabled } = props;

  const jemaat = useJemaatOptions();

  const options =
    current && !jemaat.options.some((option) => option.value === current.value)
      ? [current, ...jemaat.options]
      : jemaat.options;

  return (
    <FormSection
      legend={LEGEND[side]}
      note="Pilih jemaatnya bila terdaftar di gereja ini; bila bukan, tulis namanya. Isi salah satu saja."
      disabled={isDisabled}
    >
      <ControlField
        control={form.control}
        name={`${side}JemaatCode`}
        label="Jemaat"
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={options}
            isLoading={jemaat.isLoading}
            onSearch={jemaat.onSearch}
            isClearable
            disabled={isDisabled}
            placeholder="Cari nama atau kode jemaat"
            emptyMessage="Belum ada data jemaat"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name={`${side}Name`}
        label="Nama (bukan jemaat)"
      >
        {(field) => <Input {...field} autoCapitalize="words" maxLength={150} />}
      </ControlField>
    </FormSection>
  );
};

"use client";

import { useWatch } from "react-hook-form";

import {
  SelectField,
  type SelectOption,
  optionsOf,
} from "@/components/common/control";
import { FormSection, ControlField } from "@/components/common/form";

import {
  BLOOD_TYPE_LABEL,
  LAST_EDUCATION_LABEL,
  STATUS_PERNIKAHAN_LABEL,
} from "../types";

import { type JemaatForm } from "./form-options";
import { MasterField } from "./master-field";

const MARITAL_OPTIONS = optionsOf(STATUS_PERNIKAHAN_LABEL);

const BLOOD_OPTIONS = optionsOf(BLOOD_TYPE_LABEL);

const EDUCATION_OPTIONS: SelectOption[] = [
  { value: "", label: "Tidak diketahui" },
  ...optionsOf(LAST_EDUCATION_LABEL),
];

interface PropTypes {
  form: JemaatForm;
  isDisabled: boolean;
}

export const SocialSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const isAnggota =
    useWatch({ control: form.control, name: "typeJemaat" }) === "ANGGOTA";

  return (
    <FormSection
      legend="Data sosial"
      note={
        isAnggota
          ? "Dipakai untuk laporan gereja. Selain status pernikahan dan suku, semuanya boleh dikosongkan."
          : "Dipakai untuk laporan gereja. Semuanya boleh dikosongkan."
      }
      disabled={isDisabled}
    >
      <ControlField
        control={form.control}
        name="statusMarital"
        label="Status pernikahan"
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={MARITAL_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih status pernikahan"
          />
        )}
      </ControlField>

      <MasterField
        form={form}
        name="professionId"
        kind="profession"
        label="Pekerjaan"
        isClearable
        isDisabled={isDisabled}
      />

      <MasterField
        form={form}
        name="ethnicGroupId"
        kind="ethnic-group"
        label="Suku"
        isClearable={!isAnggota}
        isDisabled={isDisabled}
      />

      <ControlField
        control={form.control}
        name="lastEducation"
        label="Pendidikan terakhir"
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={EDUCATION_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih pendidikan terakhir"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="bloodType"
        label="Golongan darah"
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={BLOOD_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih golongan darah"
          />
        )}
      </ControlField>
    </FormSection>
  );
};

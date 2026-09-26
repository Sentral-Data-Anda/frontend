"use client";

import { useWatch } from "react-hook-form";

import {
  ComboboxField,
  DateField,
  Input,
  SelectField,
  optionsOf,
} from "@/components/common/control";
import { FormSection, ControlField } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { STATUS_JEMAAT_LABEL, TYPE_JEMAAT_LABEL } from "../types";

import { type JemaatForm } from "./form-options";

const TYPE_OPTIONS = optionsOf(TYPE_JEMAAT_LABEL);

const STATUS_OPTIONS = optionsOf(STATUS_JEMAAT_LABEL);

interface PropTypes {
  form: JemaatForm;
  isDisabled: boolean;
}

export const MembershipSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const isAnggota =
    useWatch({ control: form.control, name: "typeJemaat" }) === "ANGGOTA";
  const zoneChurch = useDdlOptions("zone-church");

  const codeInduk = useWatch({ control: form.control, name: "codeInduk" });
  const isCodeIndukChanged =
    Boolean(form.formState.defaultValues?.codeInduk) &&
    codeInduk !== form.formState.defaultValues?.codeInduk;

  return (
    <FormSection legend="Keanggotaan" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="typeJemaat"
        label="Tipe jemaat"
        hint="Anggota membutuhkan kode induk, wilayah, dan data sosial."
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={TYPE_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih tipe jemaat"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="statusJemaat"
        label="Status jemaat"
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={STATUS_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih status jemaat"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="codeInduk"
        label="Kode induk"
        isOptional={!isAnggota}
        isHintWarning={isCodeIndukChanged}
        hint={
          isCodeIndukChanged
            ? "Bila jemaat ini punya akun, username-nya ikut berubah."
            : "Bebas formatnya; juga menjadi username akun jemaat."
        }
      >
        {(field) => (
          <Input {...field} maxLength={50} autoCapitalize="characters" />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="zoneChurchId"
        label="Wilayah"
        isOptional={!isAnggota}
        hint="Bila ikut keluarga, wilayah mengikuti keluarganya."
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={zoneChurch.options}
            isLoading={zoneChurch.isLoading}
            isClearable={!isAnggota}
            disabled={isDisabled}
            placeholder="Pilih wilayah"
            emptyMessage="Belum ada data wilayah"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="joinedAt"
        label="Tanggal bergabung"
        isOptional
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={field.disabled}
            label="Tanggal bergabung"
            hint="Tanggal bergabung di gereja, bukan tanggal pencatatan."
          />
        )}
      </ControlField>
    </FormSection>
  );
};

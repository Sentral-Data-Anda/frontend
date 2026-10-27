"use client";

import { useWatch } from "react-hook-form";

import { ComboboxField, Textarea } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { type ProfileForm } from "./form-options";

interface PropTypes {
  form: ProfileForm;
  isDisabled: boolean;
}

export const AddressSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const [provincesCode, regenciesCode, districtsCode] = useWatch({
    control: form.control,
    name: ["provincesCode", "regenciesCode", "districtsCode"],
  });

  const provinces = useDdlOptions("provinces", "code");
  const regencies = useDdlOptions(
    provincesCode ? `regencies?provincesCode=${provincesCode}` : null,
    "code",
  );
  const districts = useDdlOptions(
    regenciesCode ? `districts?regenciesCode=${regenciesCode}` : null,
    "code",
  );
  const villages = useDdlOptions(
    districtsCode ? `villages?districtsCode=${districtsCode}` : null,
    "code",
  );

  const onPickLevel = (
    level: "provincesCode" | "regenciesCode" | "districtsCode",
    value: string,
  ) => {
    const below = {
      provincesCode: ["regenciesCode", "districtsCode", "villagesCode"],
      regenciesCode: ["districtsCode", "villagesCode"],
      districtsCode: ["villagesCode"],
    } as const;

    form.setValue(level, value, { shouldDirty: true, shouldValidate: true });

    for (const field of below[level]) {
      form.setValue(field, "", { shouldDirty: true });
    }
  };

  return (
    <FormSection legend="Alamat" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="provincesCode"
        label="Provinsi"
        isRequired
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={(value) => onPickLevel("provincesCode", value)}
            options={provinces.options}
            isLoading={provinces.isLoading}
            disabled={isDisabled}
            placeholder="Pilih provinsi"
            emptyMessage="Belum ada data provinsi"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="regenciesCode"
        label="Kabupaten/kota"
        isRequired
        hint={provincesCode ? undefined : "Pilih provinsi dulu."}
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={(value) => onPickLevel("regenciesCode", value)}
            options={regencies.options}
            isLoading={regencies.isLoading}
            disabled={isDisabled || !provincesCode}
            placeholder="Pilih kabupaten/kota"
            emptyMessage="Belum ada data kabupaten/kota"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="districtsCode"
        label="Kecamatan"
        isRequired
        hint={regenciesCode ? undefined : "Pilih kabupaten/kota dulu."}
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={(value) => onPickLevel("districtsCode", value)}
            options={districts.options}
            isLoading={districts.isLoading}
            disabled={isDisabled || !regenciesCode}
            placeholder="Pilih kecamatan"
            emptyMessage="Belum ada data kecamatan"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="villagesCode"
        label="Kelurahan/desa"
        isRequired
        hint={districtsCode ? undefined : "Pilih kecamatan dulu."}
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={villages.options}
            isLoading={villages.isLoading}
            disabled={isDisabled || !districtsCode}
            placeholder="Pilih kelurahan/desa"
            emptyMessage="Belum ada data kelurahan/desa"
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField
          control={form.control}
          name="address"
          label="Alamat"
          isRequired
        >
          {(field) => (
            <Textarea
              {...field}
              rows={3}
              maxLength={250}
              placeholder="Jl. Merdeka 10, RT 01 RW 02"
            />
          )}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};

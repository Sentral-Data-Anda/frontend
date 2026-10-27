"use client";

import {
  ComboboxField,
  DateField,
  Input,
  SelectField,
  optionsOf,
  type SelectOption,
} from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import {
  BLOOD_TYPE_LABEL,
  GENDER_LABEL,
  LAST_EDUCATION_LABEL,
} from "@/types/jemaat";

import { type ProfileForm } from "./form-options";

const GENDER_OPTIONS = optionsOf(GENDER_LABEL);
const BLOOD_OPTIONS = optionsOf(BLOOD_TYPE_LABEL);

const EDUCATION_OPTIONS: SelectOption[] = [
  { value: "", label: "Tidak diketahui" },
  ...optionsOf(LAST_EDUCATION_LABEL),
];

interface PropTypes {
  form: ProfileForm;
  isDisabled: boolean;
}

export const IdentitySection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Identitas" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="name"
        label="Nama lengkap"
        isRequired
      >
        {(field) => (
          <Input {...field} autoComplete="name" autoCapitalize="words" />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="gender"
        label="Jenis kelamin"
        isRequired
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            // Popup Base UI ada di portal, di luar fieldset, jadi disabled diteruskan sendiri.
            disabled={isDisabled}
            options={GENDER_OPTIONS}
            placeholder="Pilih jenis kelamin"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="birthPlace"
        label="Tempat lahir"
        isRequired
      >
        {(field) => <Input {...field} maxLength={25} />}
      </ControlField>

      <ControlField
        control={form.control}
        name="birthDate"
        label="Tanggal lahir"
        isOptional
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={field.disabled}
            variant="lahir"
            label="Tanggal lahir"
          />
        )}
      </ControlField>
    </FormSection>
  );
};

export const ContactSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection
      legend="Kontak"
      note="Keduanya boleh dikosongkan. Email dipakai sekali saja di seluruh jemaat."
      disabled={isDisabled}
    >
      <ControlField
        control={form.control}
        name="phone"
        label="Telepon"
        isOptional
      >
        {(field) => (
          <Input
            {...field}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            className="tabular-nums"
            maxLength={12}
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="email"
        label="Email"
        isOptional
      >
        {(field) => (
          <Input
            {...field}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            maxLength={150}
          />
        )}
      </ControlField>
    </FormSection>
  );
};

// Pekerjaan dan suku hanya dipilih, tidak ditambah: menambah master butuh izin
// menu Daftar Jemaat yang tidak dipegang jemaat biasa.
export const SocialSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const professions = useDdlOptions("profession");
  const ethnicGroups = useDdlOptions("ethnic-group");

  return (
    <FormSection
      legend="Data sosial"
      note="Dipakai untuk laporan gereja. Semuanya boleh dikosongkan."
      disabled={isDisabled}
    >
      <ControlField
        control={form.control}
        name="professionId"
        label="Pekerjaan"
        isOptional
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={professions.options}
            isLoading={professions.isLoading}
            isClearable
            disabled={isDisabled}
            placeholder="Pilih pekerjaan"
            emptyMessage="Belum ada data pekerjaan"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="ethnicGroupId"
        label="Suku"
        isOptional
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={ethnicGroups.options}
            isLoading={ethnicGroups.isLoading}
            isClearable
            disabled={isDisabled}
            placeholder="Pilih suku"
            emptyMessage="Belum ada data suku"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="lastEducation"
        label="Pendidikan terakhir"
        isOptional
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            disabled={isDisabled}
            options={EDUCATION_OPTIONS}
            placeholder="Pilih pendidikan terakhir"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="bloodType"
        label="Golongan darah"
        isOptional
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            disabled={isDisabled}
            options={BLOOD_OPTIONS}
            placeholder="Pilih golongan darah"
          />
        )}
      </ControlField>
    </FormSection>
  );
};

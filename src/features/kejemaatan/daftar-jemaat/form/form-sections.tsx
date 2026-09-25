"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";

import {
  ComboboxField,
  DateField,
  Input,
  Textarea,
} from "@/components/common/control";
import { SelectField, type SelectOption } from "@/components/common/control";
import { FormSection, FormWide } from "@/components/common/form";

import { useDdlOptions, useKeluargaOptions } from "../api";
import { normalizePhone, type JemaatFormValues } from "../model";
import {
  BLOOD_TYPE_LABEL,
  GENDER_LABEL,
  LAST_EDUCATION_LABEL,
  ROLE_IN_FAMILY_LABEL,
  STATUS_JEMAAT_LABEL,
  STATUS_PERNIKAHAN_LABEL,
  TYPE_JEMAAT_LABEL,
} from "../types";

import { ControlField } from "./control-field";

export type JemaatForm = UseFormReturn<JemaatFormValues>;

const optionsOf = (labels: Record<string, string>): SelectOption[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const GENDER_OPTIONS = optionsOf(GENDER_LABEL);
const TYPE_OPTIONS = optionsOf(TYPE_JEMAAT_LABEL);
const STATUS_OPTIONS = optionsOf(STATUS_JEMAAT_LABEL);
const MARITAL_OPTIONS = optionsOf(STATUS_PERNIKAHAN_LABEL);
const BLOOD_OPTIONS = optionsOf(BLOOD_TYPE_LABEL);
const ROLE_OPTIONS = optionsOf(ROLE_IN_FAMILY_LABEL);

const EDUCATION_OPTIONS: SelectOption[] = [
  { value: "", label: "Tidak diketahui" },
  ...optionsOf(LAST_EDUCATION_LABEL),
];

export function IdentitySection({
  form,
  isDisabled,
}: {
  form: JemaatForm;
  isDisabled: boolean;
}) {
  return (
    <FormSection legend="Identitas" disabled={isDisabled}>
      <ControlField control={form.control} name="name" label="Nama lengkap">
        {(field) => (
          <Input {...field} autoComplete="name" autoCapitalize="words" />
        )}
      </ControlField>

      <ControlField control={form.control} name="gender" label="Jenis kelamin">
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={GENDER_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih jenis kelamin"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="birthPlace"
        label="Tempat lahir"
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
}

export function MembershipSection({
  form,
  isDisabled,
}: {
  form: JemaatForm;
  isDisabled: boolean;
}) {
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
}

export function ContactSection({
  form,
  isDisabled,
}: {
  form: JemaatForm;
  isDisabled: boolean;
}) {
  return (
    <FormSection
      legend="Kontak"
      note="Keduanya boleh dikosongkan. Satu nomor boleh dipakai beberapa anggota keluarga."
      disabled={isDisabled}
    >
      <ControlField control={form.control} name="phone" label="Telepon">
        {(field) => (
          <Input
            {...field}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            className="tabular-nums"
            onChange={(event) =>
              field.onChange(normalizePhone(event.target.value))
            }
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="email" label="Email">
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
}

export function SocialSection({
  form,
  isDisabled,
}: {
  form: JemaatForm;
  isDisabled: boolean;
}) {
  const isAnggota =
    useWatch({ control: form.control, name: "typeJemaat" }) === "ANGGOTA";
  const profession = useDdlOptions("profession");
  const ethnicGroup = useDdlOptions("ethnic-group");

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

      <ControlField
        control={form.control}
        name="professionId"
        label="Pekerjaan"
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={profession.options}
            isLoading={profession.isLoading}
            isClearable
            disabled={isDisabled}
            placeholder="Pilih pekerjaan"
            emptyMessage="Belum ada data pekerjaan"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="ethnicGroupId" label="Suku">
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={ethnicGroup.options}
            isLoading={ethnicGroup.isLoading}
            isClearable={!isAnggota}
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
}

export function AddressSection({
  form,
  isDisabled,
}: {
  form: JemaatForm;
  isDisabled: boolean;
}) {
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
          label="Alamat lengkap"
          hint="Nama jalan, nomor, RT/RW, dan patokan bila ada."
        >
          {(field) => (
            <Textarea
              {...field}
              maxLength={150}
              autoComplete="street-address"
            />
          )}
        </ControlField>
      </FormWide>
    </FormSection>
  );
}

export function FamilySection({
  form,
  isDisabled,
}: {
  form: JemaatForm;
  isDisabled: boolean;
}) {
  const keluargaId = useWatch({ control: form.control, name: "keluargaId" });
  const keluarga = useKeluargaOptions();

  return (
    <FormSection
      legend="Keluarga"
      note="Boleh dilewati — banyak jemaat tinggal sendiri atau kos. Peran wajib diisi begitu keluarganya dipilih."
      disabled={isDisabled}
    >
      <ControlField control={form.control} name="keluargaId" label="Keluarga">
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              if (!value) {
                form.setValue("roleInFamily", "", { shouldDirty: true });
              }
            }}
            options={keluarga.options}
            isLoading={keluarga.isLoading}
            onSearch={keluarga.onSearch}
            isClearable
            disabled={isDisabled}
            placeholder="Pilih keluarga"
            emptyMessage="Belum ada data keluarga"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="roleInFamily"
        label="Peran dalam keluarga"
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={ROLE_OPTIONS}
            disabled={isDisabled || !keluargaId}
            placeholder={
              keluargaId ? "Pilih peran dalam keluarga" : "Pilih keluarga dulu"
            }
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="keluargaAsalId"
        label="Keluarga asal"
        hint="Untuk menelusuri anak yang kini berkeluarga sendiri."
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={keluarga.options}
            isLoading={keluarga.isLoading}
            onSearch={keluarga.onSearch}
            isClearable
            disabled={isDisabled}
            placeholder="Pilih keluarga asal"
            emptyMessage="Belum ada data keluarga"
          />
        )}
      </ControlField>
    </FormSection>
  );
}

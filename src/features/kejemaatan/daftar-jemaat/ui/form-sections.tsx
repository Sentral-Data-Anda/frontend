"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";

import { DateField } from "@/components/common/date-field";
import { FormSection } from "@/components/common/form-layout";
import { Input } from "@/components/common/input";
import {
  SelectField,
  type SelectOption,
} from "@/components/common/select-field";
import { Textarea } from "@/components/common/textarea";

import {
  LAST_EDUCATION_OPTIONS,
  normalizePhone,
  type JemaatFormValues,
} from "../model";
import {
  BLOOD_TYPE_LABEL,
  GENDER_LABEL,
  STATUS_JEMAAT_LABEL,
  STATUS_PERNIKAHAN_LABEL,
  TYPE_JEMAAT_LABEL,
} from "../types";

import { ControlField } from "./control-field";

export type JemaatForm = UseFormReturn<JemaatFormValues>;

/**
 * Peta label enum → pilihan. Diturunkan dari peta yang sama yang dipakai
 * layar daftar, supaya "Tidak aktif" tidak pernah punya dua ejaan.
 */
const optionsOf = (labels: Record<string, string>): SelectOption[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const GENDER_OPTIONS = optionsOf(GENDER_LABEL);
const TYPE_OPTIONS = optionsOf(TYPE_JEMAAT_LABEL);
const STATUS_OPTIONS = optionsOf(STATUS_JEMAAT_LABEL);
const MARITAL_OPTIONS = optionsOf(STATUS_PERNIKAHAN_LABEL);
const BLOOD_OPTIONS = optionsOf(BLOOD_TYPE_LABEL);
const EDUCATION_OPTIONS: SelectOption[] = LAST_EDUCATION_OPTIONS.map(
  (value) => ({ value, label: value }),
);

export function IdentitySection({
  form,
  isDisabled,
}: {
  form: JemaatForm;
  isDisabled: boolean;
}) {
  const isBirthDateUnknown = useWatch({
    control: form.control,
    name: "isBirthDateUnknown",
  });

  return (
    <FormSection legend="Identitas" disabled={isDisabled}>
      <ControlField control={form.control} name="name" label="Nama lengkap">
        {(field) => (
          // Tanpa auto-kapitalisasi: "de Fretes" dan "binti" berhak hidup apa
          // adanya (form-pattern.md §1.6).
          <Input {...field} autoComplete="name" autoCapitalize="words" />
        )}
      </ControlField>

      <ControlField control={form.control} name="gender" label="Jenis kelamin">
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={GENDER_OPTIONS}
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
      >
        {(field) => (
          <DateField
            {...field}
            disabled={isBirthDateUnknown}
            // Tanggal lahir tidak bisa di masa depan; batas atas dari
            // peramban lebih murah daripada satu aturan zod lagi.
            max={new Date().toISOString().slice(0, 10)}
          />
        )}
      </ControlField>

      {/*
        Keputusan user 2026-09-23: data yang tidak diketahui DISIMPAN sebagai
        "tidak diketahui", bukan menahan seluruh jemaat sampai lengkap.
        Petugas yang mencatat bayi hasil baptis atau data migrasi lama sering
        memang tidak punya angkanya.
      */}
      <label className="flex w-fit cursor-pointer items-center gap-2 text-body">
        <input
          type="checkbox"
          className="accent-primary focus-visible:ring-ring size-4 cursor-pointer rounded-control focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          checked={isBirthDateUnknown}
          onChange={(event) =>
            form.setValue("isBirthDateUnknown", event.target.checked, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
        Tanggal lahir tidak diketahui
      </label>
    </FormSection>
  );
}

/**
 * Tipe jemaat duduk di kelompok KEDUA, sebelum kelompok yang dipengaruhinya.
 * Ia menentukan enam field lain wajib atau tidak; menanyakannya di akhir
 * berarti menyalakan tanda wajib pada field yang sudah dilewati.
 */
export function MembershipSection({
  form,
  isDisabled,
}: {
  form: JemaatForm;
  isDisabled: boolean;
}) {
  const isAnggota =
    useWatch({ control: form.control, name: "typeJemaat" }) === "ANGGOTA";

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
            placeholder="Pilih status"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="codeInduk"
        label="Kode induk"
        isOptional={!isAnggota}
        // Keputusan user: formatnya bebas, diketik petugas. Yang perlu
        // diketahui bukan polanya, melainkan akibatnya.
        hint="Nomor anggota gereja, bebas formatnya. Juga menjadi username akun jemaat ini."
      >
        {(field) => (
          <Input {...field} maxLength={50} autoCapitalize="characters" />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="joinedAt"
        label="Tanggal bergabung"
        isOptional
        hint="Tanggal jemaat ini bergabung di gereja, bukan tanggal pencatatan."
      >
        {(field) => <DateField {...field} value={field.value} />}
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
    <FormSection legend="Kontak" disabled={isDisabled}>
      {/*
        Opsional, keputusan user (B1): bayi, anak, dan lansia tidak punya
        nomor, dan satu nomor rumah tangga dipakai bersama. Sebelumnya satu-
        satunya jalan adalah mengarang nomor — merusak persis data yang
        dipakai untuk menghubungi jemaat.
      */}
      <ControlField
        control={form.control}
        name="phone"
        label="Telepon"
        isOptional
        hint="Boleh dikosongkan, dan boleh sama dengan anggota keluarga lain."
      >
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

  return (
    <FormSection legend="Data sosial" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="statusMarital"
        label="Status pernikahan"
        isOptional={!isAnggota}
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={MARITAL_OPTIONS}
            placeholder="Pilih status pernikahan"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="lastEducation"
        label="Pendidikan terakhir"
        isOptional={!isAnggota}
        hint='Pilih "Tidak diketahui" bila memang belum diketahui.'
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={EDUCATION_OPTIONS}
            placeholder="Pilih pendidikan"
          />
        )}
      </ControlField>

      {/* Opsional untuk semua orang, keputusan user (B6): field wajib yang
          tidak bisa dijawab jujur akan diisi asal. */}
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
            options={BLOOD_OPTIONS}
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
  return (
    <FormSection legend="Alamat" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="address"
        label="Alamat lengkap"
        hint="Nama jalan, nomor, RT/RW, dan patokan bila ada."
      >
        {(field) => (
          <Textarea {...field} maxLength={150} autoComplete="street-address" />
        )}
      </ControlField>
    </FormSection>
  );
}

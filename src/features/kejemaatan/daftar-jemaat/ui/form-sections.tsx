"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";

import { ComboboxField } from "@/components/common/combobox-field";
import { DateField } from "@/components/common/date-field";
import { FormSection } from "@/components/common/form-layout";
import { Input } from "@/components/common/input";
import {
  SelectField,
  type SelectOption,
} from "@/components/common/select-field";
import { Textarea } from "@/components/common/textarea";

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
const ROLE_OPTIONS = optionsOf(ROLE_IN_FAMILY_LABEL);

/**
 * "Tidak diketahui" adalah nilai KOSONG, bukan anggota enum: be-sada
 * menyimpannya sebagai `null`. Ia tetap muncul sebagai pilihan supaya petugas
 * bisa menjawabnya dengan sengaja — melewati field begitu saja tidak bisa
 * dibedakan dari lupa.
 */
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
          // Tanpa auto-kapitalisasi paksa: "de Fretes" dan "binti" berhak
          // hidup apa adanya (form-pattern.md §1.6).
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

      {/*
        Opsional, keputusan user: tanggal lahir yang tidak diketahui disimpan
        KOSONG dan jemaatnya tetap tersimpan. Petugas yang mencatat data
        migrasi lama sering memang tidak punya angkanya, dan menahan seluruh
        orang karena satu tanggal berarti orangnya tidak tercatat sama sekali.
      */}
      <ControlField
        control={form.control}
        name="birthDate"
        label="Tanggal lahir"
        isOptional
        hint="Kosongkan bila tidak diketahui; bisa dilengkapi nanti."
      >
        {(field) => (
          <DateField
            {...field}
            // Tanggal lahir tidak bisa di masa depan; batas atas dari
            // peramban lebih murah daripada satu aturan zod lagi.
            max={new Date().toISOString().slice(0, 10)}
          />
        )}
      </ControlField>
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
  const zoneChurch = useDdlOptions("zone-church");

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
        name="zoneChurchId"
        label="Wilayah"
        isOptional={!isAnggota}
        hint="Dasar pembagian pelayanan dan statistik per wilayah."
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={zoneChurch.options}
            isLoading={zoneChurch.isLoading}
            isClearable={!isAnggota}
            placeholder="Cari wilayah"
            emptyMessage="Belum ada data wilayah"
          />
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
  const profession = useDdlOptions("profession");
  const ethnicGroup = useDdlOptions("ethnic-group");

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
        name="professionId"
        label="Pekerjaan"
        isOptional
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={profession.options}
            isLoading={profession.isLoading}
            isClearable
            placeholder="Cari pekerjaan"
            emptyMessage="Belum ada data pekerjaan"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="ethnicGroupId"
        label="Suku"
        isOptional={!isAnggota}
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={ethnicGroup.options}
            isLoading={ethnicGroup.isLoading}
            isClearable={!isAnggota}
            placeholder="Cari suku"
            emptyMessage="Belum ada data suku"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="lastEducation"
        label="Pendidikan terakhir"
        isOptional
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

      {/*
        Golongan darah, pekerjaan, dan pendidikan opsional untuk SEMUA ORANG,
        juga Anggota: field wajib yang tidak bisa dijawab jujur akan diisi
        asal, dan angka asal lebih merusak laporan daripada kolom kosong.
        Yang tetap wajib untuk Anggota tinggal status pernikahan, suku,
        wilayah, dan kode induk.
      */}
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

/**
 * Alamat bertingkat: provinsi → kabupaten → kecamatan → kelurahan.
 *
 * Mengubah tingkat atas MENGOSONGKAN seluruh tingkat di bawahnya. Tanpa itu,
 * mengganti provinsi menyisakan kelurahan dari provinsi sebelumnya — kombinasi
 * yang lolos validasi FE, diterima server, dan baru ketahuan salah saat ada
 * yang berkunjung ke alamatnya.
 *
 * Tingkat bawah terkunci selama tingkat atasnya kosong, dengan kalimat yang
 * menyebut apa yang harus dipilih dulu — daftar kosong tanpa penjelasan
 * terbaca sebagai data yang belum ada.
 */
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

  /** Satu tingkat berganti → tingkat di bawahnya dikosongkan, berurutan. */
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
            placeholder="Cari provinsi"
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
            disabled={!provincesCode}
            placeholder="Cari kabupaten/kota"
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
            disabled={!regenciesCode}
            placeholder="Cari kecamatan"
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
            disabled={!districtsCode}
            placeholder="Cari kelurahan/desa"
            emptyMessage="Belum ada data kelurahan/desa"
          />
        )}
      </ControlField>

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

/**
 * Keluarga itu opsional — banyak jemaat tinggal sendiri atau kos — tapi peran
 * WAJIB begitu keluarga dipilih: `KeluargaMember` di be-sada butuh keduanya,
 * dan salah satunya sendirian tidak tersimpan tanpa pesan apa pun.
 */
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
    <FormSection legend="Keluarga" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="keluargaId"
        label="Keluarga"
        isOptional
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              // Keluarga dikosongkan → peran ikut kosong. Peran tanpa keluarga
              // ditolak skema, dan membiarkannya berarti galat yang muncul di
              // field yang bukan baru saja disentuh user.
              if (!value) {
                form.setValue("roleInFamily", "", { shouldDirty: true });
              }
            }}
            options={keluarga.options}
            isLoading={keluarga.isLoading}
            onSearch={keluarga.onSearch}
            isClearable
            placeholder="Cari keluarga"
            emptyMessage="Belum ada data keluarga"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="roleInFamily"
        label="Peran dalam keluarga"
        isOptional={!keluargaId}
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={ROLE_OPTIONS}
            disabled={!keluargaId}
            placeholder={keluargaId ? "Pilih peran" : "Pilih keluarga dulu"}
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="keluargaAsalId"
        label="Keluarga asal"
        isOptional
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
            placeholder="Cari keluarga asal"
            emptyMessage="Belum ada data keluarga"
          />
        )}
      </ControlField>
    </FormSection>
  );
}

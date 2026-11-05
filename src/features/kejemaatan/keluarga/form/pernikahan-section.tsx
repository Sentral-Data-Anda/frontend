"use client";

import { useWatch } from "react-hook-form";

import { DateField, Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { isCouple } from "../model";

import { type KeluargaForm } from "./form-options";

/**
 * Tanggal, tempat, dan nomor surat pernikahan pasangan di KK ini.
 *
 * Hanya muncul ketika baris anggota memuat suami dan istri sekaligus, karena
 * di luar itu tidak ada siapa pun untuk dinikahi — dan backend menolak data
 * pernikahan yang dikirim tanpa pasangan.
 *
 * Fitur Keluarga adalah satu-satunya penulis pernikahan di sistem ini, jadi di
 * sinilah satu-satunya tempat tanggalnya bisa diminta; kolomnya NOT NULL, dan
 * riwayat tanpa tanggal tidak bisa diurut maupun dilaporkan. Lihat
 * ../../../../../../docs/decisions/specs/2026-11-02-peran-keluarga-dan-pernikahan-design.md.
 */

interface PropTypes {
  form: KeluargaForm;
  isDisabled: boolean;
}

export const PernikahanSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const members = useWatch({ control: form.control, name: "members" });

  if (!isCouple(members ?? [])) return null;

  return (
    <FormSection
      legend="Pernikahan"
      note="Dicatat di sini, bukan di Daftar Jemaat: layar ini yang tahu rumah tangga mana yang dimaksud."
      disabled={isDisabled}
    >
      <ControlField
        control={form.control}
        name="marriage.date"
        label="Tanggal pernikahan"
        isRequired
      >
        {(field) => (
          <DateField
            value={field.value ?? ""}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            label="Tanggal pernikahan"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="marriage.place"
        label="Tempat pernikahan"
        isOptional
      >
        {(field) => <Input {...field} maxLength={100} disabled={isDisabled} />}
      </ControlField>

      <ControlField
        control={form.control}
        name="marriage.certificateNumber"
        label="Nomor surat nikah"
        isOptional
      >
        {(field) => <Input {...field} maxLength={50} disabled={isDisabled} />}
      </ControlField>
    </FormSection>
  );
};

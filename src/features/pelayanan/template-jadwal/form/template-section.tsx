"use client";

import { DdlField, Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { useBapelOptions } from "../api";

import type { TemplateJadwalForm } from "./form-options";

const EDIT_NOTE =
  "Mengubah atau menghapus template tidak mengubah jadwal yang sudah dibuat.";

interface PropTypes {
  form: TemplateJadwalForm;
  isDisabled: boolean;
  isEdit: boolean;
}

export const TemplateSection = (props: PropTypes) => {
  const { form, isDisabled, isEdit } = props;

  const bapel = useBapelOptions();

  return (
    <FormSection
      legend="Template"
      note={isEdit ? EDIT_NOTE : undefined}
      disabled={isDisabled}
    >
      <ControlField
        control={form.control}
        name="name"
        label="Nama"
        hint="Mis. Ibadah Minggu Pagi."
      >
        {(field) => <Input {...field} maxLength={50} autoCapitalize="words" />}
      </ControlField>

      <ControlField
        control={form.control}
        name="bapelId"
        label="Badan pelayanan"
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={bapel.options}
            isLoading={bapel.isLoading}
            disabled={isDisabled}
            placeholder="Pilih badan pelayanan"
            emptyMessage="Belum ada data badan pelayanan"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="startTime"
        label="Jam mulai"
        hint="Jam bawaan saat template dipakai di Jadwal Pelayan; bisa diubah di sana."
      >
        {(field) => <Input {...field} type="time" />}
      </ControlField>

      <ControlField control={form.control} name="endTime" label="Jam selesai">
        {(field) => <Input {...field} type="time" />}
      </ControlField>
    </FormSection>
  );
};

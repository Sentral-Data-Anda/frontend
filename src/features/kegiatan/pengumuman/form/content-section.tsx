"use client";

import {
  DdlField,
  Input,
  SelectField,
  Textarea,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";

import { CATEGORY_OPTIONS } from "../model";
import type { AnnouncementBapel } from "../types";

import { useBapelOptions, type AnnouncementForm } from "./form-options";

interface PropTypes {
  form: AnnouncementForm;
  savedBapel: AnnouncementBapel | null;
  isDisabled: boolean;
}

export const ContentSection = (props: PropTypes) => {
  const { form, savedBapel, isDisabled } = props;

  const bapel = useBapelOptions(form.watch("bapelId"), savedBapel);

  return (
    <FormSection legend="Pengumuman" disabled={isDisabled}>
      <ControlField control={form.control} name="title" label="Judul">
        {(field) => <Input {...field} maxLength={200} autoComplete="off" />}
      </ControlField>

      <ControlField control={form.control} name="category" label="Kategori">
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={CATEGORY_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih kategori"
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField
          control={form.control}
          name="content"
          label="Isi"
          hint="Teks biasa. Baris baru dipertahankan."
        >
          {(field) => <Textarea {...field} rows={10} className="min-h-56" />}
        </ControlField>
      </FormWide>

      <ControlField control={form.control} name="bapelId" label="Untuk">
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={bapel.options}
            isLoading={bapel.isLoading}
            disabled={isDisabled}
            placeholder="Seluruh jemaat"
            emptyMessage="Belum ada data badan pelayanan"
          />
        )}
      </ControlField>
    </FormSection>
  );
};

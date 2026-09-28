"use client";

import {
  DdlField,
  Input,
  SelectField,
  Textarea,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { CATEGORY_OPTIONS } from "../model";

import { type AnnouncementForm } from "./form-options";

interface PropTypes {
  form: AnnouncementForm;
  isDisabled: boolean;
}

export const ContentSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const bapel = useDdlOptions("bapel", "id", form.watch("bapelId"));
  const bapelOptions = bapel.options.length
    ? [{ value: "", label: "Seluruh jemaat" }, ...bapel.options]
    : bapel.options;

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
            options={bapelOptions}
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

"use client";

import { Controller } from "react-hook-form";

import {
  AttachmentField,
  DdlField,
  Input,
  Textarea,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { type EventForm } from "./form-options";

interface PropTypes {
  form: EventForm;
  isDisabled: boolean;
  isEdit: boolean;
}

export const EventSection = (props: PropTypes) => {
  const { form, isDisabled, isEdit } = props;

  const savedBapelId = form.formState.defaultValues?.bapelId ?? "";
  const bapel = useDdlOptions("bapel", "id", savedBapelId);

  return (
    <FormSection legend="Event" disabled={isDisabled}>
      <ControlField control={form.control} name="name" label="Nama">
        {(field) => <Input {...field} maxLength={150} autoComplete="off" />}
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

      <FormWide>
        <ControlField
          control={form.control}
          name="description"
          label="Deskripsi"
          hint="Ringkasan singkat untuk petugas pendaftaran."
        >
          {(field) => <Textarea {...field} maxLength={250} rows={3} />}
        </ControlField>
      </FormWide>

      <FormWide>
        <Controller
          control={form.control}
          name="image"
          render={({ field, fieldState }) => (
            <AttachmentField
              id="image"
              label="Foto utama"
              value={field.value}
              onValueChange={field.onChange}
              max={1}
              accept="image"
              addLabel="Pilih foto utama"
              hint={
                isEdit
                  ? "Pilih foto baru hanya bila ingin mengganti."
                  : undefined
              }
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      </FormWide>
    </FormSection>
  );
};

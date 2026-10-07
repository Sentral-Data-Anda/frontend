"use client";

import { Controller } from "react-hook-form";

import { ChoiceField, DdlField, Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { PUBLISH_OPTIONS, type GaleriForm } from "./form-options";

interface PropTypes {
  form: GaleriForm;
  bapelId: string;
  isDisabled: boolean;
}

export const AlbumSection = (props: PropTypes) => {
  const { form, bapelId, isDisabled } = props;

  const bapel = useDdlOptions("bapel", "id", bapelId);

  return (
    <FormSection legend="Album" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="name"
        label="Nama album"
        hint="Mis. Retret Pemuda 2026."
      >
        {(field) => <Input {...field} maxLength={100} autoComplete="off" />}
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

      <Controller
        control={form.control}
        name="isPublish"
        render={({ field }) => (
          <div>
            <ChoiceField
              id="isPublish"
              label="Publikasi"
              value={field.value}
              onValueChange={field.onChange}
              options={PUBLISH_OPTIONS}
              disabled={isDisabled}
              hint="Hanya album terbit yang fotonya bisa tampil di website."
            />
          </div>
        )}
      />
    </FormSection>
  );
};

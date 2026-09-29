"use client";

import { DateField, DdlField, Textarea } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { todayJakarta } from "@/lib/date";

import type { RequestForm } from "./form-options";

interface PropTypes {
  form: RequestForm;
  isDisabled: boolean;
}

export const RequestSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const savedBapelId = form.formState.defaultValues?.bapelId ?? "";
  const bapels = useDdlOptions("bapel", "id", savedBapelId);

  return (
    <FormSection legend="Permintaan" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="bapelId"
        label="Badan pelayanan"
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={bapels.options}
            isLoading={bapels.isLoading}
            disabled={isDisabled}
            placeholder="Pilih badan pelayanan"
            emptyMessage="Belum ada data badan pelayanan"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="neededDate"
        label="Dibutuhkan tanggal"
        isOptional
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            min={todayJakarta()}
            label="Dibutuhkan tanggal"
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField control={form.control} name="purpose" label="Keperluan">
          {(field) => (
            <Textarea
              {...field}
              maxLength={250}
              rows={2}
              placeholder="Mis. perlengkapan retret pemuda Oktober"
            />
          )}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};

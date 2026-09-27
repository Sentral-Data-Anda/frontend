"use client";

import { DateField, DdlField, Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { type IbadahForm } from "./form-options";

interface PropTypes {
  form: IbadahForm;
  isDisabled: boolean;
}

export const ScheduleSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const savedTypeId = form.formState.defaultValues?.typeIbadahId ?? "";
  const types = useDdlOptions("type-ibadah", "id", savedTypeId);

  return (
    <FormSection legend="Ibadah" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="typeIbadahId"
        label="Tipe ibadah"
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={types.options}
            isLoading={types.isLoading}
            disabled={isDisabled}
            placeholder="Pilih tipe ibadah"
            emptyMessage="Belum ada tipe ibadah aktif. Tambahkan di menu Tipe Ibadah."
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="date" label="Tanggal">
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            label="Tanggal ibadah"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="startTime" label="Jam mulai">
        {(field) => <Input {...field} type="time" />}
      </ControlField>

      <ControlField
        control={form.control}
        name="endTime"
        label="Jam selesai"
        hint="Kosongkan bila belum pasti."
      >
        {(field) => <Input {...field} type="time" />}
      </ControlField>
    </FormSection>
  );
};

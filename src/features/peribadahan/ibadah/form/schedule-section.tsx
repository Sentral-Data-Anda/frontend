"use client";

import { DateField, DdlField, TimeField } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { endOfYearIso } from "@/lib/date";

import type { IbadahDetail } from "../types";

import { type IbadahForm } from "./form-options";
import { JadwalPelayanField } from "./jadwal-pelayan-field";

interface PropTypes {
  form: IbadahForm;
  isDisabled: boolean;
  saved?: IbadahDetail;
  onOpenJadwal: (href: string) => void;
}

export const ScheduleSection = (props: PropTypes) => {
  const { form, isDisabled, saved, onOpenJadwal } = props;

  const savedTypeId = form.formState.defaultValues?.typeIbadahId ?? "";
  const types = useDdlOptions("type-ibadah", "id", savedTypeId);
  const dateMax = endOfYearIso(1);

  return (
    <FormSection legend="Ibadah" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="typeIbadahId"
        label="Tipe ibadah"
        isRequired
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

      <ControlField
        control={form.control}
        name="date"
        label="Tanggal"
        isRequired
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            max={dateMax}
            label="Tanggal ibadah"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="startTime"
        label="Jam mulai"
        isRequired
      >
        {(field) => (
          <TimeField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            label="Jam mulai"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="endTime"
        label="Jam selesai"
        isOptional
      >
        {(field) => (
          <TimeField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            label="Jam selesai"
            hint="Kosongkan bila belum pasti."
          />
        )}
      </ControlField>

      <JadwalPelayanField
        form={form}
        isDisabled={isDisabled}
        saved={saved?.jadwalPelayan}
        onOpenJadwal={onOpenJadwal}
      />
    </FormSection>
  );
};

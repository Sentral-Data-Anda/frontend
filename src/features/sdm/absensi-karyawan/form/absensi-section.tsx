"use client";

import { useWatch } from "react-hook-form";

import {
  ComboboxField,
  DateField,
  Input,
  SelectField,
  Textarea,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { todayJakarta } from "@/lib/date";

import {
  CUTI_HINT,
  DATE_HINT,
  HOURS_HINT,
  HOURS_OFF_HINT,
  PAYROLL_NOTE,
  type AbsensiFormValues,
} from "../model";
import { isPresentStatus } from "../types";

import { STATUS_OPTIONS, type AbsensiForm } from "./form-options";

interface PropTypes {
  form: AbsensiForm;
  isDisabled: boolean;
}

export const AbsensiSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const [karyawanId, status] = useWatch({
    control: form.control,
    name: ["karyawanId", "status"],
  });
  const karyawan = useDdlOptions("karyawan", "id", karyawanId);
  const isPresent = isPresentStatus(status);

  /**
   * Mencerminkan `resolveHours` be-sada di layar, bukan menemukannya sesudah
   * menyimpan: status di luar Hadir memaksa kedua jam null di server.
   */
  const onPickStatus = (value: string) => {
    const picked = value as AbsensiFormValues["status"];

    form.setValue("status", picked, { shouldDirty: true });

    if (isPresentStatus(picked)) return;

    form.setValue("checkIn", "", { shouldDirty: true });
    form.setValue("checkOut", "", { shouldDirty: true });
    form.clearErrors(["checkIn", "checkOut"]);
  };

  return (
    <FormSection legend="Absensi" note={PAYROLL_NOTE} disabled={isDisabled}>
      <ControlField control={form.control} name="karyawanId" label="Karyawan">
        {(field) => (
          <ComboboxField
            id={field.name}
            value={field.value}
            onValueChange={field.onChange}
            options={karyawan.options}
            isLoading={karyawan.isLoading}
            disabled={isDisabled}
            placeholder="Pilih karyawan"
            emptyMessage="Belum ada karyawan aktif"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="date" label="Tanggal">
        {(field) => (
          <DateField
            id={field.name}
            label="Tanggal"
            hint={DATE_HINT}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            max={todayJakarta()}
            isClearable={false}
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="status"
        label="Status"
        hint={status === "CUTI" ? CUTI_HINT : undefined}
      >
        {(field) => (
          <SelectField
            id={field.name}
            value={field.value}
            onValueChange={onPickStatus}
            options={STATUS_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih status"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="checkIn"
        label="Jam masuk"
        hint={isPresent ? HOURS_HINT : HOURS_OFF_HINT}
      >
        {(field) => (
          <Input
            {...field}
            id={field.name}
            type="time"
            disabled={isDisabled || !isPresent}
            className="tabular-nums"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="checkOut"
        label="Jam pulang"
        hint={isPresent ? HOURS_HINT : HOURS_OFF_HINT}
      >
        {(field) => (
          <Input
            {...field}
            id={field.name}
            type="time"
            disabled={isDisabled || !isPresent}
            className="tabular-nums"
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField
          control={form.control}
          name="note"
          label="Catatan"
          isOptional
          hint="Mis. izin keperluan keluarga, atau pulang lebih awal karena acara."
        >
          {(field) => <Textarea {...field} id={field.name} maxLength={250} />}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};

"use client";

import { useEffect } from "react";
import { Controller, useWatch } from "react-hook-form";

import {
  ChoiceField,
  ComboboxField,
  DateField,
  Textarea,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { endOfYearIso } from "@/lib/date";

import { MAX_REASON, PAID_NOTE } from "../model";

import { LENGTH_OPTIONS, type CutiForm } from "./form-options";

/**
 * `DateField` membatasi ke HARI INI kalau `max` tidak diberikan, dan cuti
 * hampir selalu di masa depan — tanpa baris ini form menolak setiap tanggal
 * mulai besok ke atas dengan "tidak boleh di masa depan". Dua tahun, sama
 * dengan Kegiatan dan Pengumuman: cukup untuk cuti melahirkan yang melewati
 * tahun baru, tanpa membuka tanggal yang tidak berarti.
 */
const DATE_MAX = endOfYearIso(2);

const REASON_HINT =
  "Dibaca penanda tangan dan tersimpan di pengajuan ini. Tidak pernah tampil di daftar, kalender, atau notifikasi.";

interface PropTypes {
  form: CutiForm;
  isDisabled: boolean;
}

export const RequestSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const karyawanId = useWatch({ control: form.control, name: "karyawanId" });
  const leaveTypeId = useWatch({ control: form.control, name: "leaveTypeId" });
  const startDate = useWatch({ control: form.control, name: "startDate" });
  const endDate = useWatch({ control: form.control, name: "endDate" });
  const karyawan = useDdlOptions("karyawan", "id", karyawanId);
  const leaveTypes = useDdlOptions("tipe-cuti", "id", leaveTypeId);
  const isOneDay = Boolean(startDate) && startDate === endDate;

  useEffect(() => {
    if (!isOneDay) form.setValue("length", "penuh");
  }, [isOneDay, form]);

  return (
    <FormSection legend="Pengajuan" note={PAID_NOTE} disabled={isDisabled}>
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

      <ControlField control={form.control} name="leaveTypeId" label="Tipe cuti">
        {(field) => (
          <ComboboxField
            id={field.name}
            value={field.value}
            onValueChange={field.onChange}
            options={leaveTypes.options}
            isLoading={leaveTypes.isLoading}
            disabled={isDisabled}
            placeholder="Pilih tipe cuti"
            emptyMessage="Belum ada tipe cuti aktif"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="startDate"
        label="Tanggal mulai"
      >
        {(field) => (
          <DateField
            id={field.name}
            label="Tanggal mulai"
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            max={DATE_MAX}
            isClearable={false}
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="endDate"
        label="Tanggal selesai"
      >
        {(field) => (
          <DateField
            id={field.name}
            label="Tanggal selesai"
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            min={startDate || undefined}
            max={DATE_MAX}
            isClearable={false}
          />
        )}
      </ControlField>

      <Controller
        control={form.control}
        name="length"
        render={({ field }) => (
          <div>
            <ChoiceField
              id="length"
              label="Lama cuti"
              value={field.value}
              onValueChange={field.onChange}
              options={LENGTH_OPTIONS}
              disabled={isDisabled || !isOneDay}
            />
            {!isOneDay ? (
              <p className="text-muted-foreground mt-1.5 text-caption">
                Setengah hari hanya berlaku untuk cuti satu hari.
              </p>
            ) : null}
          </div>
        )}
      />

      <FormWide>
        <ControlField
          control={form.control}
          name="reason"
          label="Alasan"
          hint={REASON_HINT}
        >
          {(field) => (
            <Textarea
              {...field}
              maxLength={MAX_REASON}
              rows={3}
              disabled={isDisabled}
              placeholder="Mis. mendampingi orang tua kontrol ke rumah sakit"
            />
          )}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};

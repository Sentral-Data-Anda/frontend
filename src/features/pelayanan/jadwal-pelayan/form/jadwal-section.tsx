"use client";

import { useState } from "react";

import {
  DateField,
  DdlField,
  Input,
  SelectField,
} from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";
import { useBoolean } from "@/hooks/use-boolean";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { endOfYearIso } from "@/lib/date";

import { filledCount } from "../model";

import { MAKE_TEMPLATE_OPTIONS, type JadwalForm } from "./form-options";
import { TemplateField } from "./template-field";

interface PropTypes {
  form: JadwalForm;
  bapelId: string;
  isEdit: boolean;
  isCopy: boolean;
  isDisabled: boolean;
}

export const JadwalSection = (props: PropTypes) => {
  const { form, bapelId, isEdit, isCopy, isDisabled } = props;

  const bapel = useDdlOptions("bapel");
  const [pickBapel, setPickBapel] = useState("");
  const isConfirmOpen = useBoolean();
  const dateMax = endOfYearIso(1);

  const onApplyBapel = (next: string) => {
    const slots = form.getValues("slots");

    form.setValue("bapelId", next, { shouldDirty: true });
    form.setValue(
      "slots",
      slots.map((slot) => ({ ...slot, pelayan: "" })),
      { shouldDirty: true },
    );
    form.clearErrors(["bapelId", "slots"]);
  };

  const onPickBapel = (next: string) => {
    if (next === bapelId) return;
    if (!filledCount(form.getValues("slots"))) return onApplyBapel(next);

    setPickBapel(next);
    isConfirmOpen.onTrue();
  };

  return (
    <FormSection legend="Jadwal" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="bapelId"
        label="Badan pelayanan"
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={onPickBapel}
            options={bapel.options}
            isLoading={bapel.isLoading}
            disabled={isDisabled}
            placeholder="Pilih badan pelayanan"
            emptyMessage="Belum ada data badan pelayanan"
          />
        )}
      </ControlField>

      {isCopy ? null : (
        <TemplateField form={form} bapelId={bapelId} isDisabled={isDisabled} />
      )}

      <ControlField control={form.control} name="date" label="Tanggal">
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            max={dateMax}
            label="Tanggal jadwal"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="startTime" label="Jam mulai">
        {(field) => <Input {...field} type="time" />}
      </ControlField>

      <ControlField control={form.control} name="endTime" label="Jam selesai">
        {(field) => <Input {...field} type="time" />}
      </ControlField>

      <ControlField
        control={form.control}
        name="name"
        label="Nama jadwal"
        hint="Mis. Pelayan Ibadah Minggu I."
      >
        {(field) => <Input {...field} maxLength={50} autoComplete="off" />}
      </ControlField>

      {isEdit ? null : (
        <ControlField
          control={form.control}
          name="makeTemplate"
          label="Simpan juga sebagai template"
          hint="Nama jadwal menjadi nama template; yang disimpan hanya jam dan susunan tugas."
        >
          {(field) => (
            <SelectField
              value={field.value}
              onValueChange={field.onChange}
              options={MAKE_TEMPLATE_OPTIONS}
              disabled={isDisabled}
            />
          )}
        </ControlField>
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen.value}
        onOpenChange={isConfirmOpen.setValue}
        title="Konfirmasi Tindakan"
        description="Ganti badan pelayanan? Petugas yang sudah dipilih akan dikosongkan; susunan tugas tetap."
        confirmLabel="Ya"
        cancelLabel="Tidak"
        onConfirm={() => onApplyBapel(pickBapel)}
      />
    </FormSection>
  );
};

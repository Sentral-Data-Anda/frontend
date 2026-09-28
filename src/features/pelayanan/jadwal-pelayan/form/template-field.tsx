"use client";

import { useState } from "react";

import { DdlField } from "@/components/common/control";
import { FormField } from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";
import { useBoolean } from "@/hooks/use-boolean";

import { useTemplateOptions } from "../api";
import { filledCount, withTemplate } from "../model";
import type { TemplateOption } from "../types";

import type { JadwalForm } from "./form-options";

const FIELD_ID = "templateId";

interface PropTypes {
  form: JadwalForm;
  bapelId: string;
  isDisabled: boolean;
}

export const TemplateField = (props: PropTypes) => {
  const { form, bapelId, isDisabled } = props;

  const templates = useTemplateOptions(bapelId);
  const [pickTemplate, setPickTemplate] = useState({ bapelId: "", id: "" });
  const [pickPending, setPickPending] = useState<TemplateOption | null>(null);
  const isConfirmOpen = useBoolean();

  const rows = templates.data ?? [];
  const options = rows.map((template) => ({
    value: String(template.id),
    label: template.name,
    hint: `${template.startTime}–${template.endTime}`,
  }));
  const value = pickTemplate.bapelId === bapelId ? pickTemplate.id : "";

  const onApply = (template: TemplateOption) => {
    const next = withTemplate(form.getValues(), template);

    form.setValue("startTime", next.startTime, { shouldDirty: true });
    form.setValue("endTime", next.endTime, { shouldDirty: true });
    form.setValue("name", next.name, { shouldDirty: true });
    form.setValue("slots", next.slots, { shouldDirty: true });
    form.clearErrors(["startTime", "endTime", "name", "slots"]);
    setPickTemplate({ bapelId, id: String(template.id) });
  };

  const onPick = (id: string) => {
    const template = rows.find((row) => String(row.id) === id);

    if (!template) return;
    if (!filledCount(form.getValues("slots"))) return onApply(template);

    setPickPending(template);
    isConfirmOpen.onTrue();
  };

  const onConfirm = () => {
    if (pickPending) onApply(pickPending);
  };

  return (
    <>
      <FormField
        htmlFor={FIELD_ID}
        label="Isi dari template"
        hint="Menyalin jam dan susunan tugas; orangnya dipilih di bawah."
      >
        <DdlField
          value={value}
          onValueChange={onPick}
          options={options}
          isLoading={templates.isFetching}
          disabled={isDisabled || !bapelId}
          placeholder={
            bapelId ? "Pilih template" : "Pilih badan pelayanan dulu"
          }
          emptyMessage="Belum ada template untuk badan pelayanan ini."
        />
      </FormField>

      <ConfirmDialog
        isOpen={isConfirmOpen.value}
        onOpenChange={isConfirmOpen.setValue}
        title="Konfirmasi Tindakan"
        description={`Ganti susunan petugas dengan template ${pickPending?.name ?? ""}? Petugas yang sudah dipilih akan dikosongkan.`}
        confirmLabel="Ya"
        cancelLabel="Tidak"
        onConfirm={onConfirm}
      />
    </>
  );
};

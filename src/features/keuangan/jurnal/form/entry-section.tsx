"use client";

import { useFieldArray, useFormState } from "react-hook-form";

import { DateField, Input } from "@/components/common/control";
import {
  ControlField,
  FormSection,
  JournalLineList,
} from "@/components/common/form";
import { todayJakarta } from "@/lib/date";

import { DESCRIPTION_MAX, MAX_LINES, newJournalLine } from "../model";

import type { JournalForm } from "./form-options";

const LINES_NOTE =
  "Satu baris mengisi Debit atau Kredit, tidak keduanya. Draf boleh disimpan meski belum seimbang; yang perlu seimbang adalah saat diposting.";

interface PropTypes {
  form: JournalForm;
  isDisabled: boolean;
}

export const EntrySection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const rows = useFieldArray({ control: form.control, name: "lines" });
  const { errors } = useFormState({ control: form.control });
  const linesError = errors.lines?.root?.message ?? errors.lines?.message;

  const onAdd = () => {
    if (rows.fields.length >= MAX_LINES) return;

    rows.append(newJournalLine(), { shouldFocus: false });
    form.clearErrors("lines");
  };

  return (
    <>
      <FormSection
        legend="Entri"
        note="Periode bukunya diambil dari tanggal ini, jadi tidak ada pilihan bulan terpisah."
        disabled={isDisabled}
      >
        <ControlField
          control={form.control}
          name="entryDate"
          label="Tanggal"
          hint="Tanggal transaksi, tidak boleh di masa depan."
        >
          {(field) => (
            <DateField
              id="entryDate"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              max={todayJakarta()}
              label="Tanggal entri"
            />
          )}
        </ControlField>

        <ControlField
          control={form.control}
          name="description"
          label="Keterangan"
          hint="Apa yang dicatat entri ini, mis. Saldo awal per 1 Januari."
        >
          {(field) => (
            <Input
              {...field}
              maxLength={DESCRIPTION_MAX}
              autoCapitalize="sentences"
            />
          )}
        </ControlField>
      </FormSection>

      <FormSection legend="Baris" note={LINES_NOTE} disabled={isDisabled}>
        <JournalLineList
          form={form}
          name="lines"
          fieldIds={rows.fields.map((row) => row.id)}
          isDisabled={isDisabled}
          onAdd={onAdd}
          onRemove={rows.remove}
          error={linesError}
          errorId="lines-error"
        />
      </FormSection>
    </>
  );
};

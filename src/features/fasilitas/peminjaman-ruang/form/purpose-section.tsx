"use client";

import { ComboboxField, DdlField, Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { useDdlOptions, useDdlSearch } from "@/hooks/use-ddl-options";

import { PURPOSE_MAX } from "../model";
import type { LoanRoomDetail } from "../types";

import type { LoanForm } from "./form-options";

const PRIVATE_LABEL = "Pribadi / keluarga";

interface PropTypes {
  form: LoanForm;
  isDisabled: boolean;
  saved?: LoanRoomDetail;
}

export const PurposeSection = (props: PropTypes) => {
  const { form, isDisabled, saved } = props;

  const bapels = useDdlOptions("bapel", "id");
  const jemaat = useDdlSearch(
    "jemaat",
    "id",
    saved ? { value: String(saved.jemaat.id), label: saved.jemaat.name } : null,
  );
  const bapelOptions = [{ value: "", label: PRIVATE_LABEL }, ...bapels.options];

  return (
    <FormSection legend="Keperluan" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="purpose"
        label="Keperluan"
        hint="Untuk pihak luar, tulis nama dan kontaknya di sini."
      >
        {(field) => (
          <Input
            {...field}
            maxLength={PURPOSE_MAX}
            placeholder="mis. Latihan paduan suara"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="bapelId"
        label="Badan pelayanan"
        hint="Kosongkan untuk acara keluarga seperti pernikahan."
        isOptional
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={bapelOptions}
            isLoading={bapels.isLoading}
            disabled={isDisabled}
            placeholder={PRIVATE_LABEL}
            emptyMessage="Belum ada data badan pelayanan"
          />
        )}
      </ControlField>
      <ControlField
        control={form.control}
        name="jemaatId"
        label="Peminjam"
        hint="Jemaat yang bertanggung jawab atas ruang."
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={jemaat.options}
            isLoading={jemaat.isLoading}
            onSearch={jemaat.onSearch}
            disabled={isDisabled}
            placeholder="Pilih peminjam"
            emptyMessage="Jemaat tidak ditemukan"
          />
        )}
      </ControlField>
    </FormSection>
  );
};

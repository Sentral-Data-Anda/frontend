"use client";

import {
  AccountField,
  DateField,
  DdlField,
  Input,
  MethodField,
  Textarea,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { todayJakarta } from "@/lib/date";

import type { ReceiptForm } from "./form-options";

interface PropTypes {
  form: ReceiptForm;
  isDisabled: boolean;
}

export const ReceiptSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const savedBapelId = form.formState.defaultValues?.bapelId ?? "";
  const bapels = useDdlOptions("bapel", "id", savedBapelId);

  return (
    <FormSection legend="Penerimaan" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="receiptDate"
        label="Tanggal penerimaan"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            max={todayJakarta()}
            label="Tanggal penerimaan"
            isClearable={false}
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="payer" label="Diterima dari">
        {(field) => (
          <Input
            {...field}
            maxLength={150}
            autoCapitalize="words"
            placeholder="mis. Keluarga Santoso"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="intoAccountId"
        label="Masuk ke akun"
        hint="Kas atau bank yang menerima uangnya."
      >
        {(field) => (
          <AccountField
            value={field.value}
            onValueChange={field.onChange}
            type="ASSET"
            disabled={isDisabled}
            placeholder="Pilih kas atau bank"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="method"
        label="Metode"
        isOptional
      >
        {(field) => (
          <MethodField
            value={field.value}
            onValueChange={field.onChange}
            disabled={isDisabled}
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="reference"
        label="Referensi"
        isOptional
        hint="Nomor bukti transfer, nomor berita acara, atau kode dokumen lain."
      >
        {(field) => (
          <Input
            {...field}
            maxLength={100}
            autoComplete="off"
            spellCheck={false}
            placeholder="mis. BA-03/IX/2026"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="bapelId"
        label="Badan pelayanan"
        isOptional
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={bapels.options}
            isLoading={bapels.isLoading}
            disabled={isDisabled}
            placeholder="Tanpa badan pelayanan"
            emptyMessage="Belum ada data badan pelayanan"
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField
          control={form.control}
          name="description"
          label="Keterangan"
        >
          {(field) => (
            <Textarea
              {...field}
              maxLength={250}
              rows={2}
              placeholder="mis. Sewa gedung untuk resepsi keluarga Santoso"
            />
          )}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};

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

import { REFERENCE_HINT } from "../model";

import type { ExpenseForm } from "./form-options";

interface PropTypes {
  form: ExpenseForm;
  isDisabled: boolean;
}

export const ExpenseSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const savedBapelId = form.formState.defaultValues?.bapelId ?? "";
  const bapels = useDdlOptions("bapel", "id", savedBapelId);

  return (
    <FormSection legend="Pengeluaran" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="expenseDate"
        label="Tanggal keluar"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            max={todayJakarta()}
            label="Tanggal keluar"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="payee"
        label="Dibayarkan kepada"
      >
        {(field) => (
          <Input
            {...field}
            maxLength={150}
            placeholder="Mis. PLN, CV Sinar Terang, Pdt. Yosua"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="paidFromAccountId"
        label="Dibayar dari akun"
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
        label="Cara bayar"
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
        hint={REFERENCE_HINT}
        isOptional
      >
        {(field) => (
          <Input {...field} maxLength={100} placeholder="Mis. PSN-2026-0007" />
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
            options={[
              { value: "", label: "Tanpa badan pelayanan" },
              ...bapels.options,
            ]}
            isLoading={bapels.isLoading}
            disabled={isDisabled}
            placeholder="Pilih badan pelayanan"
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
              placeholder="Mis. tagihan listrik gedung ibadah September"
            />
          )}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};

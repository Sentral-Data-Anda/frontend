"use client";

import { useWatch } from "react-hook-form";

import {
  AccountField,
  BapelField,
  ChoiceField,
  DateField,
  Input,
  MethodField,
  Textarea,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { todayJakarta } from "@/lib/date";

import {
  BAPEL_CHOICE_HINT,
  BAPEL_CHOICE_OPTIONS,
  REFERENCE_HINT,
} from "../model";

import type { ExpenseForm } from "./form-options";

interface PropTypes {
  form: ExpenseForm;
  isDisabled: boolean;
}

export const ExpenseSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const bapelChoice = useWatch({ control: form.control, name: "bapelChoice" });

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
        name="bapelChoice"
        label="Belanja komisi"
        hint={BAPEL_CHOICE_HINT}
      >
        {(field) => (
          <ChoiceField
            id="bapelChoice"
            label="Belanja komisi"
            isLabelVisible={false}
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              // Jawaban dan `bapelId` dikirim keduanya, jadi nilai lama tidak
              // boleh tersangkut: server menolak keduanya yang tidak sepakat.
              if (value !== "komisi") form.setValue("bapelId", "");
            }}
            options={BAPEL_CHOICE_OPTIONS}
            disabled={isDisabled}
          />
        )}
      </ControlField>

      {bapelChoice === "komisi" ? (
        <ControlField control={form.control} name="bapelId" label="Komisi">
          {(field) => (
            <BapelField
              value={field.value}
              onValueChange={field.onChange}
              disabled={isDisabled}
            />
          )}
        </ControlField>
      ) : null}

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

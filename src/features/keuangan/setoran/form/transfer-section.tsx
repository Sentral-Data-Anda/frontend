"use client";

import {
  AccountField,
  AmountInput,
  DateField,
  Input,
  Textarea,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { todayJakarta } from "@/lib/date";

import { REFERENCE_HINT } from "../model";

import type { TransferForm } from "./form-options";

interface PropTypes {
  form: TransferForm;
  isDisabled: boolean;
}

export const TransferSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Setoran" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="transferDate"
        label="Tanggal setoran"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            max={todayJakarta()}
            label="Tanggal setoran"
            isClearable={false}
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="amount" label="Jumlah (Rp)">
        {(field) => (
          <AmountInput
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            maxDigits={13}
            maxFraction={2}
            placeholder="0"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="fromAccountId"
        label="Dari akun"
      >
        {(field) => (
          <AccountField
            value={field.value}
            onValueChange={field.onChange}
            type="ASSET"
            disabled={isDisabled}
            placeholder="Pilih akun asal"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="toAccountId" label="Ke akun">
        {(field) => (
          <AccountField
            value={field.value}
            onValueChange={field.onChange}
            type="ASSET"
            disabled={isDisabled}
            placeholder="Pilih akun tujuan"
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
          <Input {...field} maxLength={100} placeholder="Mis. 0012345678" />
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
              placeholder="Mis. setoran kolekte Minggu 27 September"
            />
          )}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};

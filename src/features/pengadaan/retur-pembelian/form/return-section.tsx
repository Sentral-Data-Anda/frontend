"use client";

import {
  ComboboxField,
  DateField,
  Textarea,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";

import { useReceiptOptions } from "../api";

import type { ReturnForm } from "./form-options";

interface PropTypes {
  form: ReturnForm;
  isDisabled: boolean;
  pinnedCode: string;
  pinnedLabel: string;
  onPickReceipt: (code: string) => void;
}

export const ReturnSection = (props: PropTypes) => {
  const { form, isDisabled, pinnedCode, pinnedLabel, onPickReceipt } = props;

  const receipts = useReceiptOptions(pinnedCode, pinnedLabel);

  return (
    <FormSection
      legend="Retur"
      note="Nilai retur dihitung dari harga pesanan dan kurs yang dipakai saat memesan."
      disabled={isDisabled}
    >
      <ControlField
        control={form.control}
        name="goodsReceiptCode"
        label="Penerimaan barang"
        isRequired
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={onPickReceipt}
            options={receipts.options}
            isLoading={receipts.isLoading}
            onSearch={receipts.onSearch}
            disabled={isDisabled}
            placeholder="Cari kode penerimaan, pesanan, atau supplier"
            emptyMessage="Tidak ada penerimaan barang"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="returnDate"
        label="Tanggal retur"
        isRequired
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            label="Tanggal retur"
            isClearable={false}
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField
          control={form.control}
          name="reason"
          label="Alasan"
          isRequired
        >
          {(field) => (
            <Textarea
              {...field}
              maxLength={250}
              rows={2}
              placeholder="Mis. empat kursi tiba dengan sandaran retak"
            />
          )}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};

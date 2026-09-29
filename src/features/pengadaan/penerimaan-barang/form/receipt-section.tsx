"use client";

import { useWatch } from "react-hook-form";

import {
  ComboboxField,
  DateField,
  Textarea,
  type SelectOption,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { todayJakarta } from "@/lib/date";

import type { ReceiptForm } from "./form-options";

interface PropTypes {
  form: ReceiptForm;
  orderOptions: readonly SelectOption[];
  isOrdersLoading: boolean;
  isDisabled: boolean;
  onPickOrder: (id: string) => void;
}

export const ReceiptSection = (props: PropTypes) => {
  const { form, orderOptions, isOrdersLoading, isDisabled, onPickOrder } =
    props;

  const orderDate = useWatch({ control: form.control, name: "orderDate" });

  return (
    <FormSection legend="Penerimaan" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="purchaseOrderId"
        label="Pesanan"
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={onPickOrder}
            options={orderOptions}
            isLoading={isOrdersLoading}
            disabled={isDisabled}
            placeholder="Pilih pesanan"
            emptyMessage="Tidak ada pesanan yang menunggu barang"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="receivedDate"
        label="Tanggal terima"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            min={orderDate || undefined}
            max={todayJakarta()}
            label="Tanggal terima"
            isClearable={false}
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField
          control={form.control}
          name="note"
          label="Catatan"
          isOptional
        >
          {(field) => (
            <Textarea
              {...field}
              maxLength={250}
              rows={2}
              placeholder="Mis. dus penyok, diterima koster"
            />
          )}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};

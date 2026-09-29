"use client";

import { useFormState, useWatch } from "react-hook-form";

import {
  ComboboxField,
  DateField,
  SelectField,
  type SelectOption,
} from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { todayJakarta } from "@/lib/date";

import type { useRatePreview } from "../api";

import type { OrderForm } from "./form-options";
import { RateHint } from "./rate-hint";

interface PropTypes {
  form: OrderForm;
  requestOptions: readonly SelectOption[];
  requestHint?: string;
  isRequestLoading: boolean;
  supplierOptions: readonly SelectOption[];
  supplierHint?: string;
  isSupplierLoading: boolean;
  currencyOptions: readonly SelectOption[];
  ratePreview: ReturnType<typeof useRatePreview>;
  isCanFillRate: boolean;
  isDisabled: boolean;
}

export const OrderSection = (props: PropTypes) => {
  const {
    form,
    requestOptions,
    requestHint,
    isRequestLoading,
    supplierOptions,
    supplierHint,
    isSupplierLoading,
    currencyOptions,
    ratePreview,
    isCanFillRate,
    isDisabled,
  } = props;

  const [currencyCode, orderDate] = useWatch({
    control: form.control,
    name: ["currencyCode", "orderDate"],
  });
  const { errors } = useFormState({
    control: form.control,
    name: "currencyCode",
  });

  return (
    <FormSection legend="Pesanan" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="purchaseRequestId"
        label="Permintaan pembelian"
        hint={requestHint}
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={requestOptions}
            isLoading={isRequestLoading}
            disabled={isDisabled}
            placeholder="Pilih permintaan pembelian"
            emptyMessage="Belum ada permintaan yang disetujui"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="supplierId"
        label="Supplier"
        hint={supplierHint}
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={supplierOptions}
            isLoading={isSupplierLoading}
            disabled={isDisabled}
            placeholder="Pilih supplier"
            emptyMessage="Belum ada supplier aktif"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="orderDate"
        label="Tanggal pesanan"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            max={todayJakarta()}
            label="Tanggal pesanan"
            isClearable={false}
          />
        )}
      </ControlField>

      <div>
        <ControlField
          control={form.control}
          name="currencyCode"
          label="Mata uang"
        >
          {(field) => (
            <SelectField
              value={field.value}
              onValueChange={field.onChange}
              options={currencyOptions}
              disabled={isDisabled}
              placeholder="Pilih mata uang"
            />
          )}
        </ControlField>
        <RateHint
          currencyCode={currencyCode}
          orderDate={orderDate}
          preview={ratePreview}
          isCanFillRate={isCanFillRate}
          isFieldInvalid={Boolean(errors.currencyCode)}
        />
      </div>
    </FormSection>
  );
};

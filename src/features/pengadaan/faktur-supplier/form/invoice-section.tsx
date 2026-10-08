"use client";

import { useWatch } from "react-hook-form";

import {
  AccountField,
  AmountInput,
  DdlField,
  Input,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { type InvoiceForm } from "./form-options";

interface PropTypes {
  form: InvoiceForm;
  isDisabled: boolean;
}

type Option = { id: number; code: string; name: string };

export const InvoiceSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const supplierId = useWatch({ control: form.control, name: "supplierId" });
  const suppliers = useDdlOptions<Option>("supplier", "id", supplierId);
  const orders = useDdlOptions("pesanan-pembelian", "id");
  const currencies = useDdlOptions("currency", "code");

  return (
    <>
      <FormSection legend="Faktur" disabled={isDisabled}>
        <ControlField
          control={form.control}
          name="supplierInvoiceNumber"
          label="Nomor faktur supplier"
        >
          {(field) => (
            <Input {...field} maxLength={50} placeholder="mis. FK/2026/0912" />
          )}
        </ControlField>

        <ControlField control={form.control} name="supplierId" label="Supplier">
          {(field) => (
            <DdlField
              id="supplierId"
              value={field.value}
              onValueChange={field.onChange}
              options={suppliers.options}
              isLoading={suppliers.isLoading}
              disabled={isDisabled}
              placeholder="Pilih supplier"
              emptyMessage="Belum ada supplier"
            />
          )}
        </ControlField>

        <ControlField
          control={form.control}
          name="purchaseOrderId"
          label="Pesanan pembelian"
          hint="Boleh kosong: tagihan bisa datang tanpa pesanan, misalnya perbaikan mendadak."
        >
          {(field) => (
            <DdlField
              id="purchaseOrderId"
              value={field.value}
              onValueChange={field.onChange}
              options={orders.options}
              isLoading={orders.isLoading}
              isClearable
              disabled={isDisabled}
              placeholder="Pilih pesanan"
              emptyMessage="Belum ada pesanan pembelian"
            />
          )}
        </ControlField>

        <ControlField
          control={form.control}
          name="invoiceDate"
          label="Tanggal faktur"
        >
          {(field) => <Input {...field} type="date" />}
        </ControlField>

        <ControlField control={form.control} name="dueDate" label="Jatuh tempo">
          {(field) => <Input {...field} type="date" />}
        </ControlField>

        <ControlField
          control={form.control}
          name="currencyCode"
          label="Mata uang"
        >
          {(field) => (
            <DdlField
              id="currencyCode"
              value={field.value}
              onValueChange={field.onChange}
              options={currencies.options}
              isLoading={currencies.isLoading}
              disabled={isDisabled}
              placeholder="Pilih mata uang"
              emptyMessage="Belum ada mata uang"
            />
          )}
        </ControlField>

        <ControlField
          control={form.control}
          name="totalForeignCurrency"
          label="Total faktur"
          hint="Angka yang tertulis di kertas supplier, dalam mata uangnya sendiri. Rupiahnya dihitung dengan kurs tanggal faktur."
        >
          {(field) => (
            <AmountInput
              value={field.value}
              onValueChange={field.onChange}
              disabled={isDisabled}
              maxDigits={13}
              maxFraction={4}
            />
          )}
        </ControlField>
      </FormSection>

      <FormSection
        legend="Akuntansi"
        note="Dipakai saat faktur ini diposting ke jurnal. Dibiarkan kosong, faktur dibebankan ke akun Beban Pengadaan di Setelan Akuntansi."
        disabled={isDisabled}
      >
        <FormWide>
          <ControlField
            control={form.control}
            name="expenseAccountId"
            label="Dibebankan ke akun"
          >
            {(field) => (
              <AccountField
                value={field.value}
                onValueChange={field.onChange}
                isClearable
                disabled={isDisabled}
                placeholder="Pilih akun beban atau aset"
              />
            )}
          </ControlField>
        </FormWide>
      </FormSection>
    </>
  );
};

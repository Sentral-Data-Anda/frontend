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

import { useOrderOptions } from "../api";

import { type InvoiceForm } from "./form-options";

interface PropTypes {
  form: InvoiceForm;
  isDisabled: boolean;
}

type Option = { id: number; code: string; name: string };

export const InvoiceSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const supplierId = useWatch({ control: form.control, name: "supplierId" });
  const items = useWatch({ control: form.control, name: "items" });
  const suppliers = useDdlOptions<Option>("supplier", "id", supplierId);
  const orders = useOrderOptions();
  const currencies = useDdlOptions("currency", "code");

  return (
    <>
      <FormSection legend="Faktur" disabled={isDisabled}>
        <ControlField
          control={form.control}
          name="supplierInvoiceNumber"
          label="Nomor faktur supplier"
          isRequired
        >
          {(field) => (
            <Input {...field} maxLength={50} placeholder="mis. FK/2026/0912" />
          )}
        </ControlField>

        <ControlField
          control={form.control}
          name="supplierId"
          label="Supplier"
          isRequired
        >
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
          isOptional
        >
          {(field) => (
            <DdlField
              id="purchaseOrderId"
              value={field.value}
              onValueChange={field.onChange}
              options={orders.data ?? []}
              isLoading={orders.isFetching}
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
          isRequired
        >
          {(field) => <Input {...field} type="date" />}
        </ControlField>

        <ControlField
          control={form.control}
          name="dueDate"
          label="Jatuh tempo"
          isRequired
        >
          {(field) => <Input {...field} type="date" />}
        </ControlField>

        <ControlField
          control={form.control}
          name="currencyCode"
          label="Mata uang"
          isRequired
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
          isRequired
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
        note={
          (items?.length ?? 0) > 0
            ? "Faktur ini punya rincian, jadi akun debitnya dibaca per baris di bawah. Satu akun untuk seluruh faktur tidak dipakai."
            : "Dipakai saat faktur ini diposting ke jurnal. Dibiarkan kosong, faktur dibebankan ke akun Beban Pengadaan di Setelan Akuntansi."
        }
        disabled={isDisabled}
      >
        {(items?.length ?? 0) > 0 ? null : (
          <FormWide>
            <ControlField
              control={form.control}
              name="expenseAccountId"
              label="Dibebankan ke akun"
              isOptional
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
        )}
      </FormSection>
    </>
  );
};

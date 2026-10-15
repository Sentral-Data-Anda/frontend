"use client";

import { ListPlus } from "lucide-react";
import { useFieldArray, useFormState, useWatch } from "react-hook-form";

import { Button } from "@/components/common/control";
import { FormSection, FormWide, LineItemList } from "@/components/common/form";
import { formatAmount, formatNumber } from "@/lib/format";

import { returnTotalText, returnedLineCount, toReturnLine } from "../model";
import type { ReceiptForReturn } from "../types";

import type { ReturnForm } from "./form-options";
import { ItemRow } from "./item-row";

interface PropTypes {
  form: ReturnForm;
  receipt: ReceiptForReturn | undefined;
  isLoadingReceipt: boolean;
  isDisabled: boolean;
}

export const ItemSection = (props: PropTypes) => {
  const { form, receipt, isLoadingReceipt, isDisabled } = props;

  const rows = useFieldArray({ control: form.control, name: "items" });
  const lines = useWatch({ control: form.control, name: "items" }) ?? [];
  const { errors } = useFormState({ control: form.control, name: "items" });
  const itemsError = errors.items?.root?.message ?? errors.items?.message;
  const count = rows.fields.length;
  const exchangeRate = receipt?.purchaseOrder.exchangeRate ?? "";
  // Tanpa kurs tidak ada rupiah untuk ditampilkan. "Rp 0" akan terbaca sebagai
  // nilai retur yang nol, bukan sebagai angka yang belum diketahui.
  const total = exchangeRate ? returnTotalText(lines, exchangeRate) : null;

  const onLoad = () => {
    if (!receipt) return;

    rows.replace(receipt.items.map(toReturnLine));
    form.clearErrors("items");
  };

  return (
    <FormSection
      legend="Barang yang dikembalikan"
      note="Isi jumlah hanya pada baris yang dikembalikan; sisanya dibiarkan kosong. Satu baris penerimaan per unit untuk barang aset, jadi tiga unit yang dipulangkan adalah tiga baris."
      disabled={isDisabled}
    >
      <FormWide className="space-y-3">
        <LineItemList
          label="Barang yang dikembalikan"
          count={count}
          empty={
            receipt
              ? "Belum ada baris. Muat baris penerimaan, lalu hapus yang tidak dikembalikan."
              : "Pilih penerimaan barang terlebih dahulu."
          }
          summary={
            count === 0
              ? undefined
              : `${formatNumber(returnedLineCount(lines))} dari ${formatNumber(count)} baris dikembalikan · Nilai retur ${total === null ? "—" : formatAmount(total)}`
          }
          error={itemsError}
          errorId="items"
        >
          {rows.fields.map((row, index) => (
            <ItemRow
              key={row.id}
              form={form}
              index={index}
              exchangeRate={exchangeRate}
              isDisabled={isDisabled}
              onRemove={rows.remove}
            />
          ))}
        </LineItemList>

        {count === 0 && receipt ? (
          <Button
            type="button"
            variant="outline"
            disabled={isDisabled || isLoadingReceipt}
            className="cursor-pointer disabled:cursor-not-allowed"
            onClick={onLoad}
          >
            <ListPlus aria-hidden />
            {isLoadingReceipt ? "Memuat baris…" : `Muat baris ${receipt.code}`}
          </Button>
        ) : null}

        {count === 0 && receipt && receipt.items.length === 0 ? (
          <p role="status" className="text-muted-foreground text-body">
            {`Penerimaan ${receipt.code} tidak punya baris yang bisa diretur.`}
          </p>
        ) : null}
      </FormWide>
    </FormSection>
  );
};

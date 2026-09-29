"use client";

import { useFormState, useWatch } from "react-hook-form";

import { Button } from "@/components/common/control";
import { FormSection, FormWide, LineItemList } from "@/components/common/form";

import { useStockItems } from "../api";
import { summaryTextOf } from "../model";

import type { ReceiptForm } from "./form-options";
import { ItemRow } from "./item-row";

interface PropTypes {
  form: ReceiptForm;
  fields: readonly { id: string }[];
  isLoading: boolean;
  loadMessage: string | null;
  isDisabled: boolean;
  onRetry?: () => void;
  onClear: (index: number) => void;
}

export const ItemSection = (props: PropTypes) => {
  const { form, fields, isLoading, loadMessage, isDisabled, onRetry, onClear } =
    props;

  const lines = useWatch({ control: form.control, name: "items" });
  const orderId = useWatch({ control: form.control, name: "purchaseOrderId" });
  const { errors } = useFormState({ control: form.control, name: "items" });
  const stock = useStockItems(fields.length > 0);
  const itemsError = errors.items?.root?.message ?? errors.items?.message;
  const isEmpty = fields.length === 0;

  const empty = isLoading ? (
    <p role="status">Memuat barang pesanan…</p>
  ) : loadMessage ? (
    <div role="alert" className="flex flex-col items-center gap-3">
      <p>{loadMessage}</p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={onRetry}
        >
          Coba lagi
        </Button>
      ) : null}
    </div>
  ) : orderId ? (
    <p>Semua barang di pesanan ini sudah diterima.</p>
  ) : (
    <p>Pilih pesanan dulu. Barang yang belum diterima akan muncul di sini.</p>
  );

  return (
    <FormSection
      legend="Barang yang datang"
      note="Jumlah terisi dari sisa pesanan. Kosongkan barang yang belum datang."
      disabled={isDisabled}
    >
      <FormWide>
        <LineItemList
          label="Barang yang datang"
          count={fields.length}
          empty={empty}
          summary={isEmpty ? undefined : summaryTextOf(lines ?? [])}
          error={itemsError}
          errorId="items-error"
        >
          {fields.map((field, index) => (
            <ItemRow
              key={field.id}
              form={form}
              index={index}
              stockItems={stock.rows}
              isStockLoading={stock.isLoading}
              isListInvalid={index === 0 && Boolean(itemsError)}
              isDisabled={isDisabled}
              onClear={onClear}
            />
          ))}
        </LineItemList>
      </FormWide>
    </FormSection>
  );
};

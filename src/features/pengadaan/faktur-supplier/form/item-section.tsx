"use client";

import { useFieldArray, useFormState, useWatch } from "react-hook-form";

import { Button } from "@/components/common/control";
import { FormSection, FormWide, LineItemList } from "@/components/common/form";
import { formatAmount } from "@/lib/format";

import { useOrderItems } from "../api";
import {
  ITEM_NOTE,
  MAX_ITEMS,
  emptyInvoiceItem,
  itemsSumText,
  orderItemsToForm,
} from "../model";

import type { InvoiceForm } from "./form-options";
import { ItemRow } from "./item-row";

interface PropTypes {
  form: InvoiceForm;
  isDisabled: boolean;
}

export const ItemSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const purchaseOrderId = useWatch({
    control: form.control,
    name: "purchaseOrderId",
  });
  const total = useWatch({
    control: form.control,
    name: "totalForeignCurrency",
  });
  const items = useWatch({ control: form.control, name: "items" });

  const orderItems = useOrderItems(purchaseOrderId);
  const rows = useFieldArray({ control: form.control, name: "items" });
  const { errors } = useFormState({ control: form.control, name: "items" });

  const itemsError = errors.items?.root?.message ?? errors.items?.message;
  const count = rows.fields.length;
  const sum = itemsSumText(items ?? []);

  const onAdd = () => {
    rows.append(emptyInvoiceItem());
    form.clearErrors("items");
  };

  const onCopyOrder = () => {
    rows.replace(orderItemsToForm(orderItems.data ?? []));
    form.clearErrors("items");
  };

  const isCopyable =
    purchaseOrderId !== "" && (orderItems.data?.length ?? 0) > 0;

  return (
    <FormSection legend="Rincian" note={ITEM_NOTE} disabled={isDisabled}>
      <FormWide>
        <div className="space-y-3">
          {isCopyable ? (
            <Button
              type="button"
              variant="outline"
              disabled={isDisabled || orderItems.isFetching}
              className="cursor-pointer disabled:cursor-not-allowed"
              onClick={onCopyOrder}
            >
              Salin rincian dari pesanan
            </Button>
          ) : null}

          <LineItemList
            label="Rincian faktur"
            count={count}
            addLabel="Tambah rincian"
            isAddDisabled={isDisabled || count >= MAX_ITEMS}
            onAdd={onAdd}
            empty="Belum ada rincian. Tanpa rincian, seluruh faktur dibebankan ke satu akun."
            summary={
              count
                ? `Jumlah rincian ${formatAmount(sum)} dari total ${formatAmount(total || "0")}`
                : undefined
            }
            error={itemsError}
            errorId="items"
          >
            {rows.fields.map((row, index) => (
              <ItemRow
                key={row.id}
                form={form}
                index={index}
                isDisabled={isDisabled}
                onRemove={rows.remove}
              />
            ))}
          </LineItemList>
        </div>
      </FormWide>
    </FormSection>
  );
};

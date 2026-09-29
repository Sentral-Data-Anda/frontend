"use client";

import { useFieldArray, useFormState, useWatch } from "react-hook-form";

import { FormSection, FormWide, LineItemList } from "@/components/common/form";
import { formatNumber, formatRupiah } from "@/lib/format";

import { MAX_ITEMS, emptyLine, lineTotalOf } from "../model";

import type { RequestForm } from "./form-options";
import { ItemRow } from "./item-row";

interface PropTypes {
  form: RequestForm;
  isDisabled: boolean;
}

export const ItemSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const rows = useFieldArray({ control: form.control, name: "items" });
  const lines = useWatch({ control: form.control, name: "items" }) ?? [];
  const { errors } = useFormState({ control: form.control, name: "items" });
  const itemsError = errors.items?.root?.message ?? errors.items?.message;
  const count = rows.fields.length;

  const onAdd = () => {
    rows.append(emptyLine(), { focusName: `items.${count}.name` });
    form.clearErrors("items");
  };

  return (
    <FormSection
      legend="Barang"
      note="Perkiraan harga termasuk PPN. Total dihitung ulang saat disimpan."
      disabled={isDisabled}
    >
      <FormWide>
        <LineItemList
          label="Barang yang diminta"
          count={count}
          isAddDisabled={isDisabled || count >= MAX_ITEMS}
          onAdd={onAdd}
          empty="Belum ada barang. Tambahkan barang yang ingin dibeli."
          summary={`${formatNumber(count)} barang · Perkiraan total ${formatRupiah(lineTotalOf(lines))}`}
          error={itemsError}
          errorId="items"
        >
          {rows.fields.map((row, index) => (
            <ItemRow
              key={row.id}
              form={form}
              index={index}
              isDisabled={isDisabled}
              isRemovable={count > 1}
              onRemove={rows.remove}
            />
          ))}
        </LineItemList>
      </FormWide>
    </FormSection>
  );
};

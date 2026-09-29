"use client";

import {
  useWatch,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

import { formatRupiah } from "@/lib/format";
import { sumAmounts } from "@/lib/number";

import { FormWide } from "../form-layout";
import { LineItemList } from "../line-items/line-item-list";

import { CashLineRow } from "./cash-line-row";

interface PropTypes<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: string;
  fieldIds: readonly string[];
  isDisabled?: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  error?: string;
  errorId?: string;
}

export function CashLineList<T extends FieldValues>(props: PropTypes<T>) {
  const {
    form,
    name,
    fieldIds,
    isDisabled = false,
    onAdd,
    onRemove,
    error,
    errorId,
  } = props;

  const lines = useWatch({ control: form.control, name: name as FieldPath<T> });
  const total = sumAmounts(
    (Array.isArray(lines) ? lines : []).map((line: { amount?: string }) =>
      String(line?.amount ?? ""),
    ),
  );

  return (
    <FormWide>
      <LineItemList
        label="Rincian"
        count={fieldIds.length}
        addLabel="Tambah baris"
        isAddDisabled={isDisabled}
        onAdd={onAdd}
        empty="Belum ada baris. Tambahkan pos dan nominalnya."
        summary={`Total ${formatRupiah(Number(total))}`}
        error={error}
        errorId={errorId}
      >
        {fieldIds.map((id, index) => (
          <CashLineRow
            key={id}
            form={form}
            name={name}
            index={index}
            isDisabled={isDisabled}
            onRemove={onRemove}
          />
        ))}
      </LineItemList>
    </FormWide>
  );
}

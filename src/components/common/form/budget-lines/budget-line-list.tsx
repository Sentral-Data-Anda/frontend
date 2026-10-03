"use client";

import {
  useWatch,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

import { formatRupiah } from "@/lib/format";
import { lineAmount, sumAmounts } from "@/lib/number";

import { FormWide } from "../form-layout";
import { LineItemList } from "../line-items/line-item-list";

import { BudgetLineRow } from "./budget-line-row";

type DraftLine = { quantity?: string; unitPrice?: string };

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

export function BudgetLineList<T extends FieldValues>(props: PropTypes<T>) {
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
    (Array.isArray(lines) ? lines : []).map((line: DraftLine) =>
      String(
        lineAmount(
          String(line?.quantity ?? ""),
          String(line?.unitPrice ?? ""),
        ) ?? 0,
      ),
    ),
  );

  return (
    <FormWide>
      <LineItemList
        label="Rincian anggaran"
        count={fieldIds.length}
        addLabel="Tambah rincian"
        isAddDisabled={isDisabled}
        onAdd={onAdd}
        empty="Belum ada rincian. Tambahkan pos, jumlah, dan harga satuannya."
        summary={`Total usulan ${formatRupiah(Number(total))}`}
        error={error}
        errorId={errorId}
      >
        {fieldIds.map((id, index) => (
          <BudgetLineRow
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

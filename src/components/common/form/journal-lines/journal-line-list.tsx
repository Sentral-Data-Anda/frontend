"use client";

import {
  useWatch,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

import { balanceOf, type BalanceLine } from "@/lib/number";

import { FormWide } from "../form-layout";
import { LineItemList } from "../line-items/line-item-list";

import { BalanceSummary } from "./balance-summary";
import { JournalLineRow } from "./journal-line-row";

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

export function JournalLineList<T extends FieldValues>(props: PropTypes<T>) {
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
  const balance = balanceOf(
    (Array.isArray(lines) ? lines : []).map((line: Partial<BalanceLine>) => ({
      debit: String(line?.debit ?? ""),
      credit: String(line?.credit ?? ""),
    })),
  );

  return (
    <FormWide>
      <LineItemList
        label="Baris jurnal"
        count={fieldIds.length}
        addLabel="Tambah baris"
        isAddDisabled={isDisabled}
        onAdd={onAdd}
        empty="Belum ada baris. Entri jurnal perlu paling sedikit dua baris."
        summary={<BalanceSummary {...balance} />}
        error={error}
        errorId={errorId}
      >
        {fieldIds.map((id, index) => (
          <JournalLineRow
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

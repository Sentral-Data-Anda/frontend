"use client";

import {
  useWatch,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

import type { SelectOption } from "@/components/common/control";
import { formatAmount } from "@/lib/format";
import { sumAmounts } from "@/lib/number";

import { FormWide } from "../form-layout";
import { LineItemList } from "../line-items/line-item-list";

import { UsageLineRow } from "./usage-line-row";

interface PropTypes<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: string;
  fieldIds: readonly string[];
  programOptions: readonly SelectOption[];
  isProgramLoading: boolean;
  minDate?: string;
  maxDate?: string;
  isDisabled?: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  error?: string;
  errorId?: string;
}

export function UsageLineList<T extends FieldValues>(props: PropTypes<T>) {
  const {
    form,
    name,
    fieldIds,
    programOptions,
    isProgramLoading,
    minDate,
    maxDate,
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
        label="Rincian pemakaian"
        count={fieldIds.length}
        addLabel="Tambah baris"
        isAddDisabled={isDisabled}
        onAdd={onAdd}
        empty="Belum ada baris. Tambahkan tanggal, pos, dan nominalnya."
        summary={`Total pemakaian ${formatAmount(total)}`}
        error={error}
        errorId={errorId}
      >
        {fieldIds.map((id, index) => (
          <UsageLineRow
            key={id}
            form={form}
            name={name}
            index={index}
            programOptions={programOptions}
            isProgramLoading={isProgramLoading}
            minDate={minDate}
            maxDate={maxDate}
            isDisabled={isDisabled}
            onRemove={onRemove}
          />
        ))}
      </LineItemList>
    </FormWide>
  );
}

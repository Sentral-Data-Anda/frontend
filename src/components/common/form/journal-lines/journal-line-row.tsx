"use client";

import type { ReactNode } from "react";
import {
  Controller,
  useWatch,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

import { AccountField, AmountInput, Input } from "@/components/common/control";
import { formatRupiah } from "@/lib/format";

import { LineItemCard } from "../line-items/line-item-card";
import { useLineItemErrors } from "../line-items/use-line-item-errors";

import { useAccountLabel } from "./use-account-label";

export const JOURNAL_LINE_FIELDS = [
  "accountId",
  "debit",
  "credit",
  "description",
] as const;

export type JournalLineField = (typeof JOURNAL_LINE_FIELDS)[number];

const LABEL = "text-muted-foreground mb-1 block text-caption";

interface PropTypes<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: string;
  index: number;
  isDisabled?: boolean;
  onRemove: (index: number) => void;
}

export function JournalLineRow<T extends FieldValues>(props: PropTypes<T>) {
  const { form, name, index, isDisabled = false, onRemove } = props;

  const path = `${name}.${index}`;
  const line = useWatch({ control: form.control, name: path as FieldPath<T> });
  const errors = useLineItemErrors(
    form.control,
    name,
    index,
    JOURNAL_LINE_FIELDS,
  );
  const accountLabel = useAccountLabel(line?.accountId);

  const fieldPath = (field: JournalLineField) =>
    `${path}.${field}` as FieldPath<T>;

  const onSide = (side: "debit" | "credit", next: string) => {
    const other = side === "debit" ? "credit" : "debit";

    form.setValue(fieldPath(side), next as never, { shouldDirty: true });
    if (next)
      form.setValue(fieldPath(other), "" as never, { shouldDirty: true });
  };

  const ariaOf = (field: JournalLineField) => ({
    id: errors.idOf(field),
    "aria-invalid": errors.isInvalid(field) || undefined,
    "aria-describedby": errors.messageIdOf(field),
  });

  const cell = (
    field: JournalLineField,
    label: string,
    className: string,
    control: ReactNode,
  ) => (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={errors.idOf(field)} className={LABEL}>
        {label}
        <span className="sr-only"> baris {index + 1}</span>
      </label>
      {control}
    </div>
  );

  const side = (field: "debit" | "credit", label: string) =>
    cell(
      field,
      label,
      "flex-[1_1_9rem]",
      <Controller
        control={form.control}
        name={fieldPath(field)}
        render={({ field: control }) => (
          <AmountInput
            {...ariaOf(field)}
            ref={control.ref}
            value={String(control.value ?? "")}
            onValueChange={(next) => onSide(field, next)}
            onBlur={control.onBlur}
            disabled={isDisabled}
            maxDigits={13}
            maxFraction={2}
          />
        )}
      />,
    );

  if (!line) return null;

  const amount = line.debit || line.credit;
  const title =
    String(line.description || "").trim() ||
    accountLabel ||
    `Baris ${index + 1}`;

  return (
    <LineItemCard
      index={index}
      title={title}
      meta={
        amount
          ? `${line.debit ? "Debit" : "Kredit"} ${formatRupiah(Number(amount))}`
          : undefined
      }
      removeLabel={`Hapus baris ${index + 1}`}
      isRemoveDisabled={isDisabled}
      onRemove={onRemove}
      messages={errors.messages}
    >
      {cell(
        "accountId",
        "Akun",
        "flex-[2_1_16rem]",
        <Controller
          control={form.control}
          name={fieldPath("accountId")}
          render={({ field: control }) => (
            <AccountField
              {...ariaOf("accountId")}
              value={String(control.value ?? "")}
              onValueChange={control.onChange}
              disabled={isDisabled}
            />
          )}
        />,
      )}

      {side("debit", "Debit")}
      {side("credit", "Kredit")}

      {cell(
        "description",
        "Keterangan",
        "flex-[2_1_14rem]",
        <Controller
          control={form.control}
          name={fieldPath("description")}
          render={({ field: control }) => (
            <Input
              {...ariaOf("description")}
              ref={control.ref}
              value={String(control.value ?? "")}
              onChange={control.onChange}
              onBlur={control.onBlur}
              disabled={isDisabled}
              maxLength={250}
            />
          )}
        />,
      )}
    </LineItemCard>
  );
}

"use client";

import {
  Controller,
  useWatch,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

import { AccountField, AmountInput, Input } from "@/components/common/control";
import { formatAmount } from "@/lib/format";
import { lineAmount } from "@/lib/number";

import { useAccountLabel } from "../journal-lines/use-account-label";
import { LineItemCard } from "../line-items/line-item-card";
import { useLineItemErrors } from "../line-items/use-line-item-errors";

import { LineCell } from "./line-cell";

export const BUDGET_LINE_FIELDS = [
  "accountId",
  "description",
  "quantity",
  "unitPrice",
  "note",
] as const;

export type BudgetLineField = (typeof BUDGET_LINE_FIELDS)[number];

interface PropTypes<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: string;
  index: number;
  isDisabled?: boolean;
  onRemove: (index: number) => void;
}

export function BudgetLineRow<T extends FieldValues>(props: PropTypes<T>) {
  const { form, name, index, isDisabled = false, onRemove } = props;

  const path = `${name}.${index}`;
  const line = useWatch({ control: form.control, name: path as FieldPath<T> });
  const errors = useLineItemErrors(
    form.control,
    name,
    index,
    BUDGET_LINE_FIELDS,
  );
  const accountLabel = useAccountLabel(line?.accountId);

  const ariaOf = (field: BudgetLineField) => ({
    id: errors.idOf(field),
    "aria-invalid": errors.isInvalid(field) || undefined,
    "aria-describedby": errors.messageIdOf(field),
  });

  if (!line) return null;

  const subtotal = lineAmount(
    String(line.quantity ?? ""),
    String(line.unitPrice ?? ""),
  );
  const title =
    String(line.description || "").trim() ||
    accountLabel ||
    `Baris ${index + 1}`;

  return (
    <LineItemCard
      index={index}
      title={title}
      meta={subtotal ? formatAmount(subtotal) : undefined}
      removeLabel={`Hapus baris ${index + 1}`}
      isRemoveDisabled={isDisabled}
      onRemove={onRemove}
      messages={errors.messages}
    >
      <LineCell
        htmlFor={errors.idOf("accountId")}
        label="Pos"
        index={index}
        className="flex-[2_1_16rem]"
      >
        <Controller
          control={form.control}
          name={`${path}.accountId` as FieldPath<T>}
          render={({ field: control }) => (
            <AccountField
              {...ariaOf("accountId")}
              value={String(control.value ?? "")}
              onValueChange={control.onChange}
              disabled={isDisabled}
              placeholder="Pilih pos"
            />
          )}
        />
      </LineCell>

      <LineCell
        htmlFor={errors.idOf("description")}
        label="Uraian"
        index={index}
        className="flex-[2_1_14rem]"
      >
        <Controller
          control={form.control}
          name={`${path}.description` as FieldPath<T>}
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
        />
      </LineCell>

      <LineCell
        htmlFor={errors.idOf("quantity")}
        label="Jumlah"
        index={index}
        className="flex-[1_1_7rem]"
      >
        <Controller
          control={form.control}
          name={`${path}.quantity` as FieldPath<T>}
          render={({ field: control }) => (
            <AmountInput
              {...ariaOf("quantity")}
              ref={control.ref}
              value={String(control.value ?? "")}
              onValueChange={control.onChange}
              onBlur={control.onBlur}
              disabled={isDisabled}
              maxDigits={10}
              maxFraction={2}
            />
          )}
        />
      </LineCell>

      <LineCell
        htmlFor={errors.idOf("unitPrice")}
        label="Harga satuan (Rp)"
        index={index}
        className="flex-[1_1_10rem]"
      >
        <Controller
          control={form.control}
          name={`${path}.unitPrice` as FieldPath<T>}
          render={({ field: control }) => (
            <AmountInput
              {...ariaOf("unitPrice")}
              ref={control.ref}
              value={String(control.value ?? "")}
              onValueChange={control.onChange}
              onBlur={control.onBlur}
              disabled={isDisabled}
              maxDigits={13}
              maxFraction={2}
            />
          )}
        />
      </LineCell>

      <div className="min-w-0 flex-[1_1_10rem]">
        <span className="text-muted-foreground mb-1 block text-caption">
          Subtotal
        </span>
        <output
          aria-label={`Subtotal baris ${index + 1}`}
          className="flex min-h-control items-center justify-end text-body tabular-nums"
        >
          {formatAmount(subtotal || "0")}
        </output>
      </div>

      <LineCell
        htmlFor={errors.idOf("note")}
        label="Catatan"
        index={index}
        className="flex-[2_1_14rem]"
      >
        <Controller
          control={form.control}
          name={`${path}.note` as FieldPath<T>}
          render={({ field: control }) => (
            <Input
              {...ariaOf("note")}
              ref={control.ref}
              value={String(control.value ?? "")}
              onChange={control.onChange}
              onBlur={control.onBlur}
              disabled={isDisabled}
              maxLength={250}
            />
          )}
        />
      </LineCell>
    </LineItemCard>
  );
}

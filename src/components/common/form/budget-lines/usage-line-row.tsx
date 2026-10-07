"use client";

import {
  Controller,
  useWatch,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

import {
  AccountField,
  AmountInput,
  DateField,
  DdlField,
  Input,
  type SelectOption,
} from "@/components/common/control";
import { formatAmount } from "@/lib/format";

import { useAccountLabel } from "../journal-lines/use-account-label";
import { LineItemCard } from "../line-items/line-item-card";
import { useLineItemErrors } from "../line-items/use-line-item-errors";

import { LineCell } from "./line-cell";

export const USAGE_LINE_FIELDS = [
  "spentDate",
  "accountId",
  "programId",
  "description",
  "amount",
] as const;

export type UsageLineField = (typeof USAGE_LINE_FIELDS)[number];

interface PropTypes<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: string;
  index: number;
  programOptions: readonly SelectOption[];
  isProgramLoading: boolean;
  minDate?: string;
  maxDate?: string;
  isDisabled?: boolean;
  onRemove: (index: number) => void;
}

export function UsageLineRow<T extends FieldValues>(props: PropTypes<T>) {
  const {
    form,
    name,
    index,
    programOptions,
    isProgramLoading,
    minDate,
    maxDate,
    isDisabled = false,
    onRemove,
  } = props;

  const path = `${name}.${index}`;
  const line = useWatch({ control: form.control, name: path as FieldPath<T> });
  const errors = useLineItemErrors(
    form.control,
    name,
    index,
    USAGE_LINE_FIELDS,
  );
  const accountLabel = useAccountLabel(line?.accountId);

  const ariaOf = (field: UsageLineField) => ({
    id: errors.idOf(field),
    "aria-invalid": errors.isInvalid(field) || undefined,
    "aria-describedby": errors.messageIdOf(field),
  });

  if (!line) return null;

  const source = String(line.cashExpenseCode ?? "");
  const title =
    String(line.description || "").trim() ||
    accountLabel ||
    `Baris ${index + 1}`;

  return (
    <LineItemCard
      index={index}
      title={
        source ? (
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <span className="min-w-0 truncate">{title}</span>
            <span className="text-muted-foreground shrink-0 text-caption">
              dari {source}
            </span>
          </span>
        ) : (
          title
        )
      }
      meta={line.amount ? formatAmount(line.amount) : undefined}
      removeLabel={`Hapus baris ${index + 1}`}
      isRemoveDisabled={isDisabled}
      onRemove={onRemove}
      messages={errors.messages}
    >
      <LineCell
        htmlFor={errors.idOf("spentDate")}
        label="Tanggal"
        index={index}
        className="flex-[1_1_11rem]"
      >
        <Controller
          control={form.control}
          name={`${path}.spentDate` as FieldPath<T>}
          render={({ field: control }) => (
            <DateField
              {...ariaOf("spentDate")}
              value={String(control.value ?? "")}
              onValueChange={control.onChange}
              onBlur={control.onBlur}
              variant="dekat"
              label="Tanggal pemakaian"
              min={minDate}
              max={maxDate}
              isClearable={false}
              disabled={isDisabled}
            />
          )}
        />
      </LineCell>

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
        htmlFor={errors.idOf("programId")}
        label="Program"
        index={index}
        className="flex-[2_1_14rem]"
      >
        <Controller
          control={form.control}
          name={`${path}.programId` as FieldPath<T>}
          render={({ field: control }) => (
            <DdlField
              {...ariaOf("programId")}
              value={String(control.value ?? "")}
              onValueChange={control.onChange}
              options={programOptions}
              isLoading={isProgramLoading}
              disabled={isDisabled}
              placeholder="Tanpa program"
              emptyMessage="Belum ada program badan pelayanan ini"
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
        htmlFor={errors.idOf("amount")}
        label="Nominal (Rp)"
        index={index}
        className="flex-[1_1_10rem]"
      >
        <Controller
          control={form.control}
          name={`${path}.amount` as FieldPath<T>}
          render={({ field: control }) => (
            <AmountInput
              {...ariaOf("amount")}
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
    </LineItemCard>
  );
}

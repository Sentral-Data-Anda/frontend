"use client";

import type { ReactNode } from "react";
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
  Input,
  SelectField,
} from "@/components/common/control";
import { formatAmount } from "@/lib/format";

import { useAccountLabel } from "../journal-lines/use-account-label";
import { LineItemCard } from "../line-items/line-item-card";
import { useLineItemErrors } from "../line-items/use-line-item-errors";

export const CASH_LINE_FIELDS = [
  "accountId",
  "amount",
  "description",
  "loanId",
  "loanPortion",
] as const;

export type CashLineField = (typeof CASH_LINE_FIELDS)[number];

const LABEL = "text-muted-foreground mb-1 block text-caption";

/**
 * Bagian cicilan yang dibayar sebuah baris.
 *
 * Hanya bagian pokok yang mengurangi sisa pinjaman, jadi ia dipilih per baris
 * dan bukan per dokumen: satu cicilan berbunga punya dua baris yang menunjuk
 * pinjaman yang sama dengan bagian yang berbeda.
 */
const PORTION_OPTIONS = [
  { value: "PRINCIPAL", label: "Pokok" },
  { value: "INTEREST", label: "Bunga" },
];

interface PropTypes<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: string;
  index: number;
  isDisabled?: boolean;
  onRemove: (index: number) => void;
  /**
   * Pinjaman yang boleh ditunjuk baris ini. Dioper dari fitur, bukan diambil
   * di sini: komponen bersama tidak mengimpor fitur. Tanpa prop ini kedua
   * kolomnya tidak muncul sama sekali, sehingga layar yang tidak mengenal
   * pinjaman tidak berubah.
   */
  loanOptions?: readonly { value: string; label: string }[];
}

export function CashLineRow<T extends FieldValues>(props: PropTypes<T>) {
  const {
    form,
    name,
    index,
    isDisabled = false,
    onRemove,
    loanOptions,
  } = props;

  const path = `${name}.${index}`;
  const line = useWatch({ control: form.control, name: path as FieldPath<T> });
  const errors = useLineItemErrors(form.control, name, index, CASH_LINE_FIELDS);
  const accountLabel = useAccountLabel(line?.accountId);

  const ariaOf = (field: CashLineField) => ({
    id: errors.idOf(field),
    "aria-invalid": errors.isInvalid(field) || undefined,
    "aria-describedby": errors.messageIdOf(field),
  });

  const cell = (
    field: CashLineField,
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

  if (!line) return null;

  const title =
    String(line.description || "").trim() ||
    accountLabel ||
    `Baris ${index + 1}`;

  return (
    <LineItemCard
      index={index}
      title={title}
      meta={line.amount ? formatAmount(line.amount) : undefined}
      removeLabel={`Hapus baris ${index + 1}`}
      isRemoveDisabled={isDisabled}
      onRemove={onRemove}
      messages={errors.messages}
    >
      {cell(
        "accountId",
        "Pos",
        "flex-[2_1_16rem]",
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
        />,
      )}

      {cell(
        "amount",
        "Nominal (Rp)",
        "flex-[1_1_10rem]",
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
        />,
      )}

      {loanOptions === undefined
        ? null
        : cell(
            "loanId",
            "Pinjaman",
            "flex-[2_1_14rem]",
            <Controller
              control={form.control}
              name={`${path}.loanId` as FieldPath<T>}
              render={({ field: control }) => (
                <SelectField
                  {...ariaOf("loanId")}
                  value={String(control.value ?? "")}
                  onValueChange={(value) => {
                    control.onChange(value);

                    // Keduanya terisi atau keduanya kosong. Membiarkan
                    // bagiannya tertinggal saat pinjamannya dilepas mengirim
                    // bentuk yang ditolak server dan basis data.
                    if (!value) {
                      form.setValue(
                        `${path}.loanPortion` as FieldPath<T>,
                        "" as never,
                      );
                    }
                  }}
                  options={[
                    { value: "", label: "Bukan pinjaman" },
                    ...loanOptions,
                  ]}
                  placeholder="Bukan pinjaman"
                  disabled={isDisabled}
                />
              )}
            />,
          )}

      {loanOptions === undefined || !line.loanId
        ? null
        : cell(
            "loanPortion",
            "Bagian",
            "flex-[1_1_9rem]",
            <Controller
              control={form.control}
              name={`${path}.loanPortion` as FieldPath<T>}
              render={({ field: control }) => (
                <SelectField
                  {...ariaOf("loanPortion")}
                  value={String(control.value ?? "")}
                  onValueChange={control.onChange}
                  options={PORTION_OPTIONS}
                  disabled={isDisabled}
                  placeholder="Pilih bagian"
                />
              )}
            />,
          )}

      {cell(
        "description",
        "Keterangan",
        "flex-[2_1_14rem]",
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
        />,
      )}
    </LineItemCard>
  );
}

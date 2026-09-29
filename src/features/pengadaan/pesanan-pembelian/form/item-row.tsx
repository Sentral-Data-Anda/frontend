"use client";

import type { ReactNode } from "react";
import { Controller, useWatch } from "react-hook-form";

import {
  AmountInput,
  DdlField,
  Input,
  type SelectOption,
} from "@/components/common/control";
import { LineItemCard, useLineItemErrors } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { LINE_FIELDS, isForeign, lineSubtotalText } from "../model";

import type { OrderForm } from "./form-options";

const LABEL = "text-muted-foreground mb-1 block text-caption";

interface PropTypes {
  form: OrderForm;
  index: number;
  currencyCode: string;
  unitOptions: readonly SelectOption[];
  typeOptions: readonly SelectOption[];
  isOptionsLoading: boolean;
  isDisabled: boolean;
  onRemove: (index: number) => void;
}

export const ItemRow = (props: PropTypes) => {
  const {
    form,
    index,
    currencyCode,
    unitOptions,
    typeOptions,
    isOptionsLoading,
    isDisabled,
    onRemove,
  } = props;

  const line = useWatch({ control: form.control, name: `items.${index}` });
  const errors = useLineItemErrors(form.control, "items", index, LINE_FIELDS);
  const rooms = useDdlOptions("room", "id", line?.roomId ?? "");
  const title = line?.name.trim() || `Barang ${index + 1}`;
  const isValas = isForeign(currencyCode);

  const cell = (
    field: (typeof LINE_FIELDS)[number],
    label: string,
    className: string,
    control: ReactNode,
  ) => (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={errors.idOf(field)} className={LABEL}>
        {label}
        <span className="sr-only"> barang {index + 1}</span>
      </label>
      {control}
    </div>
  );

  const ariaOf = (field: (typeof LINE_FIELDS)[number]) => ({
    id: errors.idOf(field),
    "aria-invalid": errors.isInvalid(field) || undefined,
    "aria-describedby": errors.messageIdOf(field),
  });

  const ddl = (
    field: "unitId" | "typeId" | "roomId",
    label: string,
    className: string,
    options: readonly SelectOption[],
    isLoading: boolean,
  ) =>
    cell(
      field,
      label,
      className,
      <Controller
        control={form.control}
        name={`items.${index}.${field}`}
        render={({ field: control }) => (
          <DdlField
            {...ariaOf(field)}
            value={control.value}
            onValueChange={control.onChange}
            options={options}
            isLoading={isLoading}
            disabled={isDisabled}
            placeholder={`Pilih ${label.toLowerCase()}`}
            emptyMessage="Belum ada pilihan"
          />
        )}
      />,
    );

  if (!line) return null;

  return (
    <LineItemCard
      index={index}
      title={title}
      meta={`Subtotal ${lineSubtotalText(line, currencyCode)}`}
      removeLabel={`Hapus ${title}`}
      isRemoveDisabled={isDisabled}
      onRemove={onRemove}
      messages={errors.messages}
    >
      {cell(
        "name",
        "Nama barang",
        "flex-[2_1_14rem]",
        <Controller
          control={form.control}
          name={`items.${index}.name`}
          render={({ field }) => (
            <Input
              {...field}
              {...ariaOf("name")}
              maxLength={150}
              autoComplete="off"
              placeholder="mis. Mixer digital 32 kanal"
            />
          )}
        />,
      )}

      {cell(
        "description",
        "Keterangan",
        "flex-[3_1_16rem]",
        <Controller
          control={form.control}
          name={`items.${index}.description`}
          render={({ field }) => (
            <Input
              {...field}
              {...ariaOf("description")}
              maxLength={250}
              autoComplete="off"
              placeholder="mis. merek, ukuran, warna"
            />
          )}
        />,
      )}

      {cell(
        "quantity",
        "Jumlah",
        "flex-[1_1_5.5rem] max-w-32",
        <Controller
          control={form.control}
          name={`items.${index}.quantity`}
          render={({ field }) => (
            <AmountInput
              {...ariaOf("quantity")}
              ref={field.ref}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              maxDigits={6}
            />
          )}
        />,
      )}

      {cell(
        "unitPrice",
        `Harga satuan (${currencyCode})`,
        "flex-[2_1_9rem]",
        <Controller
          control={form.control}
          name={`items.${index}.unitPrice`}
          render={({ field }) => (
            <AmountInput
              {...ariaOf("unitPrice")}
              ref={field.ref}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              maxDigits={isValas ? 11 : 13}
              maxFraction={isValas ? 2 : 0}
            />
          )}
        />,
      )}

      {ddl(
        "unitId",
        "Satuan",
        "flex-[1_1_8rem]",
        unitOptions,
        isOptionsLoading,
      )}
      {ddl(
        "typeId",
        "Tipe barang",
        "flex-[1_1_10rem]",
        typeOptions,
        isOptionsLoading,
      )}
      {ddl(
        "roomId",
        "Ruang simpan",
        "flex-[1_1_11rem]",
        rooms.options,
        rooms.isLoading,
      )}
    </LineItemCard>
  );
};

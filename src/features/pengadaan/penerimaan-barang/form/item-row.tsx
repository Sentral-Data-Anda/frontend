"use client";

import { Controller, useWatch } from "react-hook-form";

import {
  AmountInput,
  ChoiceField,
  ComboboxField,
  optionsOf,
} from "@/components/common/control";
import { LineItemCard, useLineItemErrors } from "@/components/common/form";

import {
  TARGET_HINT,
  assetHintOf,
  isReceiving,
  lineMetaOf,
  stockOptionsOf,
} from "../model";
import { TARGET_LABEL, type StockItemOption } from "../types";

import type { ReceiptForm } from "./form-options";

const FIELDS = [
  "purchaseOrderItemId",
  "quantityReceived",
  "target",
  "stockItemId",
] as const;

const TARGET_OPTIONS = optionsOf(TARGET_LABEL);

const LABEL = "text-muted-foreground mb-1 block text-caption";

const NOTE = "text-muted-foreground basis-full text-caption";

interface PropTypes {
  form: ReceiptForm;
  index: number;
  stockItems: readonly StockItemOption[];
  isStockLoading: boolean;
  isListInvalid: boolean;
  isDisabled: boolean;
  onClear: (index: number) => void;
}

export const ItemRow = (props: PropTypes) => {
  const {
    form,
    index,
    stockItems,
    isStockLoading,
    isListInvalid,
    isDisabled,
    onClear,
  } = props;

  const line = useWatch({ control: form.control, name: `items.${index}` });
  const { idOf, isInvalid, messageIdOf, messages } = useLineItemErrors(
    form.control,
    "items",
    index,
    FIELDS,
  );

  if (!line) return null;

  const isOn = isReceiving(line);
  const isQuantityInvalid = isInvalid("quantityReceived") || isListInvalid;

  return (
    <LineItemCard
      index={index}
      title={
        <span
          id={idOf("purchaseOrderItemId")}
          tabIndex={-1}
          aria-invalid={isInvalid("purchaseOrderItemId") || undefined}
          aria-describedby={messageIdOf("purchaseOrderItemId")}
          className="outline-none"
        >
          {line.name}
        </span>
      }
      meta={
        line.description
          ? `${line.description} · ${lineMetaOf(line)}`
          : lineMetaOf(line)
      }
      removeLabel={`Tidak diterima sekarang: ${line.name}`}
      isRemoveDisabled={isDisabled || !isOn}
      onRemove={onClear}
      messages={messages}
    >
      <div className="w-40 shrink-0">
        <label htmlFor={idOf("quantityReceived")} className={LABEL}>
          {`Diterima sekarang (${line.unit})`}
          <span className="sr-only"> {line.name}</span>
        </label>
        <Controller
          control={form.control}
          name={`items.${index}.quantityReceived`}
          render={({ field }) => (
            <AmountInput
              ref={field.ref}
              id={idOf("quantityReceived")}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              maxDigits={6}
              placeholder="0"
              aria-invalid={isQuantityInvalid || undefined}
              aria-describedby={
                messageIdOf("quantityReceived") ??
                (isListInvalid ? "items-error" : undefined)
              }
            />
          )}
        />
      </div>

      {isOn ? (
        <div
          id={idOf("target")}
          tabIndex={-1}
          aria-invalid={isInvalid("target") || undefined}
          aria-describedby={messageIdOf("target")}
          className="min-w-0 max-w-sm flex-[1_1_18rem] rounded-control outline-none"
        >
          <span aria-hidden className={LABEL}>
            Jadi
          </span>
          <Controller
            control={form.control}
            name={`items.${index}.target`}
            render={({ field }) => (
              <ChoiceField
                id={`items-${index}-target`}
                label="Jadi"
                isLabelVisible={false}
                value={field.value}
                onValueChange={field.onChange}
                options={TARGET_OPTIONS}
                disabled={isDisabled}
              />
            )}
          />
        </div>
      ) : (
        <p className="text-muted-foreground flex h-control items-center text-body">
          Tidak diterima sekarang
        </p>
      )}

      {isOn && line.target === "STOCK" ? (
        <div className="min-w-0 max-w-md flex-[1_1_18rem]">
          <label htmlFor={idOf("stockItemId")} className={LABEL}>
            Tambah ke<span className="sr-only"> {line.name}</span>
          </label>
          <Controller
            control={form.control}
            name={`items.${index}.stockItemId`}
            render={({ field }) => (
              <ComboboxField
                id={idOf("stockItemId")}
                value={field.value}
                onValueChange={field.onChange}
                options={stockOptionsOf(stockItems, line)}
                isLoading={isStockLoading}
                disabled={isDisabled}
                placeholder="Cari barang persediaan"
                aria-invalid={isInvalid("stockItemId") || undefined}
                aria-describedby={messageIdOf("stockItemId")}
              />
            )}
          />
        </div>
      ) : null}

      {isOn && line.target === "ASSET" ? (
        <p className={NOTE}>{assetHintOf(line)}</p>
      ) : null}

      {isOn && !line.target ? <p className={NOTE}>{TARGET_HINT}</p> : null}
    </LineItemCard>
  );
};

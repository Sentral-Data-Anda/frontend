"use client";

import Link from "next/link";
import { Controller, useWatch } from "react-hook-form";

import {
  ChoiceField,
  DateField,
  Input,
  Textarea,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { todayJakarta } from "@/lib/date";
import { formatNumber } from "@/lib/format";
import { toDigits } from "@/lib/number";

import {
  DEFAULT_SOURCE,
  FORM_SOURCE_OPTIONS,
  FORM_TYPE_OPTIONS,
  OPNAME_CREATE_PATH,
  balanceAfterOf,
  stockShortageOf,
  type FormType,
} from "../model";
import type { StockOption } from "../types";

import { noteCopyOf, type MovementForm } from "./form-options";

const PURCHASE_HINT =
  "Pembelian lewat pemasok dan faktur dicatat di Penerimaan Barang.";

interface PropTypes {
  form: MovementForm;
  isDisabled: boolean;
  stock: StockOption | undefined;
}

export const MovementSection = (props: PropTypes) => {
  const { form, isDisabled, stock } = props;

  const { isCanCreate: isCanCreateOpname } = useMenuAccess(MENU.STOK_OPNAME);
  const [type, source, quantity] = useWatch({
    control: form.control,
    name: ["type", "source", "quantity"],
  });
  const unitSuffix = stock ? ` (${stock.unit.name})` : "";
  const balanceAfter = stock ? balanceAfterOf({ type, quantity }, stock) : null;
  const note = noteCopyOf(source);

  const onPickType = (value: string) => {
    const next = value as FormType;

    form.setValue("type", next, { shouldDirty: true });
    form.setValue("source", DEFAULT_SOURCE[next], { shouldDirty: true });
  };

  const onPickSource = (value: string) => {
    form.setValue("source", value, { shouldDirty: true });
    form.clearErrors("note");
  };

  return (
    <FormSection legend="Mutasi" disabled={isDisabled}>
      <Controller
        control={form.control}
        name="type"
        render={({ field }) => (
          <ChoiceField
            id="type"
            label="Jenis"
            value={field.value}
            onValueChange={onPickType}
            options={FORM_TYPE_OPTIONS}
            disabled={isDisabled}
          />
        )}
      />

      <Controller
        control={form.control}
        name="source"
        render={({ field }) => (
          <div>
            <ChoiceField
              id="source"
              label={type === "IN" ? "Sumber" : "Alasan"}
              value={field.value}
              onValueChange={onPickSource}
              options={FORM_SOURCE_OPTIONS[type]}
              disabled={isDisabled}
            />
            {field.value === "MANUAL" ? (
              <p className="text-muted-foreground mt-1.5 text-caption">
                {PURCHASE_HINT}
              </p>
            ) : null}
          </div>
        )}
      />

      <ControlField
        control={form.control}
        name="quantity"
        label={`Jumlah${unitSuffix}`}
        hint={
          stock && balanceAfter !== null
            ? (stockShortageOf({ type, quantity }, stock) ??
              `Stok sesudah mutasi: ${formatNumber(balanceAfter)} ${stock.unit.name}`)
            : undefined
        }
        isHintWarning={balanceAfter !== null && balanceAfter < 0}
      >
        {(field) => (
          <Input
            {...field}
            onChange={(event) =>
              field.onChange(toDigits(event.target.value, 6))
            }
            inputMode="numeric"
            autoComplete="off"
            placeholder="mis. 10"
            className="tabular-nums"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="movementDate" label="Tanggal">
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            max={todayJakarta()}
            label="Tanggal mutasi"
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField
          control={form.control}
          name="note"
          label={note.label}
          isOptional={source !== "DONATION"}
        >
          {(field) => (
            <Textarea
              {...field}
              maxLength={250}
              rows={3}
              placeholder={note.placeholder}
            />
          )}
        </ControlField>
      </FormWide>

      <FormWide>
        <p className="text-muted-foreground text-caption">
          Stok tidak sesuai hitungan?{" "}
          {isCanCreateOpname ? (
            <Link
              href={OPNAME_CREATE_PATH}
              className="text-primary cursor-pointer font-medium underline-offset-4 outline-none hover:underline focus-visible:underline"
            >
              Pakai Stok Opname.
            </Link>
          ) : (
            "Pakai Stok Opname."
          )}
        </p>
      </FormWide>
    </FormSection>
  );
};

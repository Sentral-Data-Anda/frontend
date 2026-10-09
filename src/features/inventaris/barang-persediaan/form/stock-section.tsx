"use client";

import Link from "next/link";
import { useWatch } from "react-hook-form";

import { Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { toDigits } from "@/lib/number";

import { movementCreateHref, quantityOf } from "../model";
import type { StockItem } from "../types";

import { type StockForm } from "./form-options";

const OPENING_HINT =
  "Dicatat sebagai mutasi Stok awal hari ini. Sesudahnya stok hanya berubah lewat Mutasi Stok atau Stok Opname.";

const REORDER_HINT =
  "Barang ditandai Menipis bila stok sama atau di bawah angka ini.";

interface PropTypes {
  form: StockForm;
  isDisabled: boolean;
  item?: StockItem;
}

export const StockSection = (props: PropTypes) => {
  const { form, isDisabled, item } = props;

  const { isCanCreate: isCanCreateMovement } = useMenuAccess(
    MENU.STOCK_MOVEMENT,
  );
  const unitId = useWatch({ control: form.control, name: "unitId" });
  const units = useDdlOptions("unit", "id");
  const unitName = units.options.find(
    (option) => option.value === unitId,
  )?.label;
  const unitSuffix = unitName ? ` (${unitName})` : "";

  return (
    <FormSection legend="Stok" disabled={isDisabled}>
      {item ? (
        <div className="text-body">
          <p className="text-muted-foreground mb-1.5 font-medium">
            Stok sekarang
          </p>
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-semibold tabular-nums">
              {quantityOf(item)}
            </span>
            {isCanCreateMovement ? (
              <Link
                href={movementCreateHref(item.code)}
                className="text-primary cursor-pointer font-medium underline-offset-4 outline-none hover:underline focus-visible:underline"
              >
                Catat mutasi
              </Link>
            ) : null}
          </p>
        </div>
      ) : (
        <ControlField
          control={form.control}
          name="openingQuantity"
          label={`Stok awal${unitSuffix}`}
          hint={OPENING_HINT}
        >
          {(field) => (
            <Input
              {...field}
              onChange={(event) =>
                field.onChange(toDigits(event.target.value, 6))
              }
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              className="tabular-nums"
            />
          )}
        </ControlField>
      )}

      <ControlField
        control={form.control}
        name="reorderPoint"
        label={`Batas stok menipis${unitSuffix}`}
        hint={REORDER_HINT}
        isOptional
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
    </FormSection>
  );
};

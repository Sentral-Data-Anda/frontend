"use client";

import { ComboboxField, type SelectOption } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { useDdlSearch } from "@/hooks/use-ddl-options";

import { STOCK_DDL } from "../api";
import { stockHintOf } from "../model";
import type { StockOption } from "../types";

import { type MovementForm } from "./form-options";

interface PropTypes {
  form: MovementForm;
  isDisabled: boolean;
  pinned: SelectOption | null;
  picked: StockOption | undefined;
  onPickStock: (row: StockOption | null) => void;
}

export const ItemSection = (props: PropTypes) => {
  const { form, isDisabled, pinned, picked, onPickStock } = props;

  const stock = useDdlSearch<StockOption>(STOCK_DDL, "id", pinned, stockHintOf);

  const onPick = (value: string) =>
    onPickStock(stock.rows.find((row) => String(row.id) === value) ?? null);

  return (
    <FormSection legend="Barang" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="stockItemId"
        label="Barang persediaan"
        hint={picked ? stockHintOf(picked) : undefined}
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              onPick(value);
            }}
            options={stock.options}
            isLoading={stock.isLoading}
            onSearch={stock.onSearch}
            disabled={isDisabled}
            placeholder="Pilih barang persediaan"
            emptyMessage="Tidak ada barang persediaan dengan nama atau kode itu"
          />
        )}
      </ControlField>
    </FormSection>
  );
};

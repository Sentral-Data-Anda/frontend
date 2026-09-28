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
}

export const ItemSection = (props: PropTypes) => {
  const { form, isDisabled, pinned, picked } = props;

  const stock = useDdlSearch<StockOption>(STOCK_DDL, "id", pinned, stockHintOf);

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
            onValueChange={field.onChange}
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

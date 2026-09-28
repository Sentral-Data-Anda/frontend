"use client";

import { DdlField, Input, Textarea } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { savedOf, type StockForm } from "./form-options";

interface PropTypes {
  form: StockForm;
  isDisabled: boolean;
}

export const ItemSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const types = useDdlOptions("type-item", "id", savedOf(form, "typeId"));
  const units = useDdlOptions("unit", "id", savedOf(form, "unitId"));

  return (
    <FormSection legend="Barang" disabled={isDisabled}>
      <ControlField control={form.control} name="name" label="Nama">
        {(field) => (
          <Input
            {...field}
            maxLength={150}
            autoComplete="off"
            placeholder="mis. Lilin Altar"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="typeId" label="Tipe">
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={types.options}
            isLoading={types.isLoading}
            disabled={isDisabled}
            placeholder="Pilih tipe"
            emptyMessage="Belum ada tipe barang"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="unitId" label="Satuan">
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={units.options}
            isLoading={units.isLoading}
            disabled={isDisabled}
            placeholder="Pilih satuan"
            emptyMessage="Belum ada satuan"
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField
          control={form.control}
          name="description"
          label="Keterangan"
          isOptional
        >
          {(field) => <Textarea {...field} maxLength={250} rows={3} />}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};

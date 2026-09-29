"use client";

import { DdlField, Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { toDigits } from "@/lib/number";

import type { MaintenanceForm } from "./form-options";

interface PropTypes {
  form: MaintenanceForm;
  isDisabled: boolean;
}

export const VendorSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const suppliers = useDdlOptions("supplier", "id");

  return (
    <FormSection
      legend="Biaya dan pelaksana"
      note="Opsional."
      disabled={isDisabled}
    >
      <ControlField control={form.control} name="cost" label="Biaya (Rp)">
        {(field) => (
          <Input
            {...field}
            onChange={(event) =>
              field.onChange(toDigits(event.target.value, 12))
            }
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            className="tabular-nums"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="supplierId" label="Supplier">
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={[
              { value: "", label: "Tanpa supplier" },
              ...suppliers.options,
            ]}
            isLoading={suppliers.isLoading}
            disabled={isDisabled}
            placeholder="Pilih supplier"
            emptyMessage="Belum ada supplier"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="performedBy"
        label="Dikerjakan oleh"
        hint="Isi nama bila dikerjakan tanpa supplier, mis. relawan jemaat."
      >
        {(field) => <Input {...field} maxLength={150} autoComplete="off" />}
      </ControlField>
    </FormSection>
  );
};

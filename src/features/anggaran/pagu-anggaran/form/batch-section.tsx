"use client";

import { useFieldArray, useWatch } from "react-hook-form";

import { SelectField, type SelectOption } from "@/components/common/control";
import {
  ControlField,
  FormSection,
  FormWide,
  LineItemList,
} from "@/components/common/form";
import { formatAmount } from "@/lib/format";
import { sumAmounts } from "@/lib/number";

import { FORM_NOTE, MAX_BATCH_ROWS, emptyBatchRow } from "../model";

import { BatchRow } from "./batch-row";
import { type BatchForm } from "./form-options";

interface PropTypes {
  form: BatchForm;
  yearOptions: readonly SelectOption[];
  isDisabled: boolean;
}

export const BatchSection = (props: PropTypes) => {
  const { form, yearOptions, isDisabled } = props;

  const rows = useFieldArray({ control: form.control, name: "items" });
  const items = useWatch({ control: form.control, name: "items" });
  const total = sumAmounts((items ?? []).map((item) => item.amount ?? ""));
  const error = form.formState.errors.items?.message;

  return (
    <FormSection legend="Pagu" note={FORM_NOTE} disabled={isDisabled}>
      <ControlField control={form.control} name="year" label="Tahun pelayanan">
        {(field) => (
          <SelectField
            id={field.name}
            value={field.value}
            onValueChange={field.onChange}
            options={yearOptions}
            disabled={isDisabled}
            placeholder="Pilih tahun pelayanan"
          />
        )}
      </ControlField>

      <FormWide>
        <LineItemList
          label="Baris pagu anggaran"
          count={rows.fields.length}
          addLabel="Tambah badan pelayanan"
          isAddDisabled={isDisabled || rows.fields.length >= MAX_BATCH_ROWS}
          onAdd={() => rows.append(emptyBatchRow())}
          empty="Belum ada badan pelayanan. Tambahkan badan pelayanan dan pagunya."
          summary={`Total ${formatAmount(total)}`}
          error={error}
          errorId="items-error"
        >
          {rows.fields.map((row, index) => (
            <BatchRow
              key={row.id}
              form={form}
              index={index}
              isDisabled={isDisabled}
              onRemove={rows.remove}
            />
          ))}
        </LineItemList>
      </FormWide>
    </FormSection>
  );
};

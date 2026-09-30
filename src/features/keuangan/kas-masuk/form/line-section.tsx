"use client";

import { useFieldArray, useFormState } from "react-hook-form";

import { CashLineList, FormSection } from "@/components/common/form";

import { newReceiptLine } from "../model";

import type { ReceiptForm } from "./form-options";

interface PropTypes {
  form: ReceiptForm;
  note?: string;
  isDisabled: boolean;
}

export const LineSection = (props: PropTypes) => {
  const { form, note, isDisabled } = props;

  const rows = useFieldArray({ control: form.control, name: "lines" });
  const { errors } = useFormState({ control: form.control, name: "lines" });
  const linesError = errors.lines?.root?.message ?? errors.lines?.message;

  const onAdd = () => {
    rows.append(newReceiptLine(), { shouldFocus: false });
    form.clearErrors("lines");
  };

  return (
    <FormSection legend="Rincian" note={note} disabled={isDisabled}>
      <CashLineList
        form={form}
        name="lines"
        fieldIds={rows.fields.map((row) => row.id)}
        isDisabled={isDisabled}
        onAdd={onAdd}
        onRemove={rows.remove}
        error={linesError}
        errorId="lines-error"
      />
    </FormSection>
  );
};

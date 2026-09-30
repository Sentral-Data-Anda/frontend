"use client";

import { useFieldArray, useFormState } from "react-hook-form";

import { CashLineList, FormSection } from "@/components/common/form";

import { LINE_NOTE, MAX_LINES, emptyLine } from "../model";

import type { ExpenseForm } from "./form-options";

interface PropTypes {
  form: ExpenseForm;
  isDisabled: boolean;
}

export const LineSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const rows = useFieldArray({ control: form.control, name: "lines" });
  const { errors } = useFormState({ control: form.control, name: "lines" });
  const linesError = errors.lines?.root?.message ?? errors.lines?.message;
  const count = rows.fields.length;

  const onAdd = () => {
    rows.append(emptyLine());
    form.clearErrors("lines");
  };

  return (
    <FormSection legend="Rincian" note={LINE_NOTE} disabled={isDisabled}>
      <CashLineList
        form={form}
        name="lines"
        fieldIds={rows.fields.map((row) => row.id)}
        isDisabled={isDisabled || count >= MAX_LINES}
        onAdd={onAdd}
        onRemove={rows.remove}
        error={linesError}
        errorId="lines"
      />
    </FormSection>
  );
};

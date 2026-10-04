"use client";

import { useFieldArray, useFormState } from "react-hook-form";

import { BudgetLineList, FormSection } from "@/components/common/form";

import { ITEM_NOTE, emptyItem } from "../model";

import type { ProgramForm } from "./form-options";

interface PropTypes {
  form: ProgramForm;
  isDisabled: boolean;
}

export const ItemSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const rows = useFieldArray({ control: form.control, name: "items" });
  const { errors } = useFormState({ control: form.control, name: "items" });
  const itemsError = errors.items?.root?.message ?? errors.items?.message;
  const onAdd = () => {
    rows.append(emptyItem());
    form.clearErrors("items");
  };

  return (
    <FormSection
      legend="Rincian anggaran"
      note={ITEM_NOTE}
      disabled={isDisabled}
    >
      <BudgetLineList
        form={form}
        name="items"
        fieldIds={rows.fields.map((row) => row.id)}
        isDisabled={isDisabled}
        onAdd={onAdd}
        onRemove={rows.remove}
        error={itemsError}
        errorId="items"
      />
    </FormSection>
  );
};

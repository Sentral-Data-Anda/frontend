"use client";

import { useFieldArray, useFormState, useWatch } from "react-hook-form";

import { FormSection, UsageLineList } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { useBudgetSetting } from "../api";
import {
  LINE_NOTE,
  budgetYearOfMonth,
  emptyLine,
  spentDateBounds,
} from "../model";

import type { ReportForm } from "./form-options";

interface PropTypes {
  form: ReportForm;
  isDisabled: boolean;
}

export const LineSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const rows = useFieldArray({ control: form.control, name: "lines" });
  const { errors } = useFormState({ control: form.control, name: "lines" });
  const bapelId = useWatch({ control: form.control, name: "bapelId" });
  const month = useWatch({ control: form.control, name: "month" });
  const setting = useBudgetSetting();
  const budgetYear = budgetYearOfMonth(setting.data?.budgetYears ?? [], month);
  const programs = useDdlOptions(
    bapelId && budgetYear
      ? `program?bapelId=${bapelId}&year=${budgetYear}`
      : null,
  );
  const linesError = errors.lines?.root?.message ?? errors.lines?.message;
  const bounds = spentDateBounds(month);

  const onAdd = () => {
    rows.append(emptyLine());
    form.clearErrors("lines");
  };

  return (
    <FormSection
      legend="Rincian pemakaian"
      note={LINE_NOTE}
      disabled={isDisabled}
    >
      <UsageLineList
        form={form}
        name="lines"
        fieldIds={rows.fields.map((row) => row.id)}
        programOptions={programs.options}
        isProgramLoading={programs.isLoading}
        minDate={bounds.min}
        maxDate={bounds.max}
        isDisabled={isDisabled}
        onAdd={onAdd}
        onRemove={rows.remove}
        error={linesError}
        errorId="lines"
      />
    </FormSection>
  );
};

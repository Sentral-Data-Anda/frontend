"use client";

import { useFieldArray, useFormState } from "react-hook-form";

import { CashLineList, FormSection } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { LINE_NOTE, MAX_LINES, emptyLine } from "../model";

import type { ExpenseForm } from "./form-options";

type LoanOption = { id: number; code: string; name: string };

/**
 * Pinjaman yang masih berjalan, sebagai pilihan baris.
 *
 * Lewat ddl, bukan mengimpor fitur Pinjaman: fitur tidak saling mengimpor, dan
 * daftar ini dijaga oleh menu yang FORMNYA memakainya — Kas Masuk dan Kas
 * Keluar ikut disebut pada guard-nya.
 */
const useLoanOptions = () => {
  const { isCanView } = useMenuAccess(MENU.LOAN);
  // `null` mematikan query-nya: peran tanpa akses Pinjaman tidak perlu
  // memintanya, dan akan dijawab 403.
  const loans = useDdlOptions<LoanOption>(isCanView ? "pinjaman" : null);

  if (!isCanView) return undefined;

  return loans.rows.map((loan) => ({
    value: String(loan.id),
    label: `${loan.code} \u00b7 ${loan.name}`,
  }));
};

interface PropTypes {
  form: ExpenseForm;
  isDisabled: boolean;
}

export const LineSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const loanOptions = useLoanOptions();
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
        loanOptions={loanOptions}
        error={linesError}
        errorId="lines"
      />
    </FormSection>
  );
};

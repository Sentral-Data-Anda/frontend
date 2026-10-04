"use client";

import { useForm, useWatch } from "react-hook-form";

import { SelectField } from "@/components/common/control";
import { ControlField, FormAlert } from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";
import { applyServerError } from "@/lib/form-error";
import type { BudgetSetting } from "@/types/anggaran";

import { useSaveBudgetSetting } from "../api";
import {
  SETTING_REVERSIBLE_HINT,
  budgetYearSentence,
  errorFixOf,
  startMonthOptions,
} from "../model";

const MONTH_OPTIONS = startMonthOptions();

type Values = { startMonth: string };

interface PropTypes {
  isOpen: boolean;
  setting: BudgetSetting;
  onClose: () => void;
  onSaved: () => void;
}

export const BudgetYearDialog = (props: PropTypes) => {
  const { isOpen, setting, onClose, onSaved } = props;

  const saveSetting = useSaveBudgetSetting();
  const form = useForm<Values>({
    defaultValues: {
      startMonth: String(setting.startMonth ?? setting.budgetYear.startMonth),
    },
  });
  const { isSubmitting } = form.formState;
  const startMonth = useWatch({ control: form.control, name: "startMonth" });
  const fix = errorFixOf(saveSetting.error);

  const onSubmit = form.handleSubmit(async (values) => {
    saveSetting.reset();

    try {
      await saveSetting.mutateAsync({ startMonth: Number(values.startMonth) });

      onSaved();
    } catch (error) {
      applyServerError(error, form.setError);
    }
  });

  const onOpenChange = (isNextOpen: boolean) => {
    if (isNextOpen || isSubmitting) return;

    onClose();
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Tahun pelayanan"
      description={budgetYearSentence(
        setting.budgetYear.year,
        Number(startMonth) || 1,
      )}
      confirmLabel={isSubmitting ? "Menyimpan…" : "Simpan"}
      isPending={isSubmitting}
      isClosedOnConfirm={false}
      onConfirm={() => void onSubmit()}
    >
      <form noValidate onSubmit={(event) => event.preventDefault()}>
        <ControlField
          control={form.control}
          name="startMonth"
          label="Bulan mulai"
          hint={SETTING_REVERSIBLE_HINT}
        >
          {(field) => (
            <SelectField
              value={field.value}
              onValueChange={field.onChange}
              options={MONTH_OPTIONS}
              disabled={isSubmitting}
            />
          )}
        </ControlField>

        {saveSetting.error ? (
          <div className="mt-3 space-y-2">
            <FormAlert
              title="Bulan mulai belum berubah."
              message={saveSetting.error.message}
            />

            {fix ? <p className="text-body">{fix}</p> : null}
          </div>
        ) : null}
      </form>
    </ConfirmDialog>
  );
};

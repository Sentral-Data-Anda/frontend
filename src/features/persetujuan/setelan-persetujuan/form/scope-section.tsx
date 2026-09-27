"use client";

import { useWatch } from "react-hook-form";

import { Input } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";

import { useBapelOptions } from "../api";
import { amountLabelsOf, previewAmount } from "../model";

import { DdlField } from "./ddl-field";
import { withEmptyOption, type SetelanForm } from "./form-options";

const ALL_BAPEL = "Semua badan pelayanan (alur umum)";

const NOTE =
  "Alur khusus badan pelayanan didahulukan daripada alur umum. Batas rentang ikut dihitung: 0–1.000.000 dan 1.000.000–5.000.000 dianggap bertumpang tindih, jadi mulai rentang berikutnya dari 1.000.001.";

const toDigits = (value: string) => value.replace(/\D/g, "").slice(0, 15);

interface PropTypes {
  form: SetelanForm;
  isDisabled: boolean;
}

export const ScopeSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const bapel = useBapelOptions();
  const [documentType, minAmount, maxAmount] = useWatch({
    control: form.control,
    name: ["documentType", "minAmount", "maxAmount"],
  });

  const labels = amountLabelsOf(documentType);
  const hintOf = (value: string, empty: string) =>
    value ? previewAmount(documentType, value) : empty;

  return (
    <FormSection legend="Cakupan" note={NOTE} disabled={isDisabled}>
      <FormWide>
        <ControlField
          control={form.control}
          name="bapelId"
          label="Badan pelayanan"
        >
          {(field) => (
            <DdlField
              value={field.value}
              onValueChange={field.onChange}
              options={withEmptyOption(ALL_BAPEL, bapel.options)}
              isLoading={bapel.isLoading}
              disabled={isDisabled}
              placeholder={ALL_BAPEL}
              emptyMessage="Belum ada data badan pelayanan"
            />
          )}
        </ControlField>
      </FormWide>

      <ControlField
        control={form.control}
        name="minAmount"
        label={labels.min}
        hint={hintOf(minAmount, "Kosongkan untuk tanpa batas bawah.")}
      >
        {(field) => (
          <Input
            {...field}
            onChange={(event) => field.onChange(toDigits(event.target.value))}
            inputMode="numeric"
            autoComplete="off"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="maxAmount"
        label={labels.max}
        hint={hintOf(maxAmount, "Kosongkan untuk tanpa batas atas.")}
      >
        {(field) => (
          <Input
            {...field}
            onChange={(event) => field.onChange(toDigits(event.target.value))}
            inputMode="numeric"
            autoComplete="off"
          />
        )}
      </ControlField>
    </FormSection>
  );
};

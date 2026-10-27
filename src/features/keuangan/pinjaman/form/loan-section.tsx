"use client";

import { useWatch } from "react-hook-form";

import {
  AmountInput,
  ChoiceField,
  DateField,
  DdlField,
  Input,
  SelectField,
  Textarea,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { formatAmount } from "@/lib/format";

import {
  DIRECTION_LABEL,
  INTEREST_MODE_OPTIONS,
  previewInterest,
} from "../model";

import { type PinjamanForm } from "./form-options";

interface PropTypes {
  form: PinjamanForm;
  isDisabled: boolean;
}

const DIRECTION_OPTIONS = [
  { value: "BORROWED", label: DIRECTION_LABEL.BORROWED },
  { value: "LENT", label: DIRECTION_LABEL.LENT },
];

export const LoanSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const values = useWatch({ control: form.control });
  const jemaatId = values.jemaatId ?? "";
  const jemaat = useDdlOptions("jemaat", "id", jemaatId);

  const interestMode = values.interestMode ?? "NONE";
  const principal = Number(values.principal ?? 0);
  const interest = previewInterest({
    principal: values.principal ?? "",
    termMonths: values.termMonths ?? "",
    interestMode,
    interestPercent: values.interestPercent ?? "",
  });

  return (
    <>
      <FormSection legend="Pinjaman" disabled={isDisabled}>
        <FormWide>
          <ControlField
            control={form.control}
            name="direction"
            label="Arah pinjaman"
            hint="Menentukan lewat mana uangnya dicatat: yang diterima gereja masuk lewat Kas Masuk, yang diberikan gereja keluar lewat Kas Keluar."
            isRequired
          >
            {(field) => (
              <ChoiceField
                id="direction"
                label="Arah pinjaman"
                isLabelVisible={false}
                value={field.value}
                onValueChange={field.onChange}
                options={DIRECTION_OPTIONS}
                disabled={isDisabled}
              />
            )}
          </ControlField>
        </FormWide>

        <ControlField
          control={form.control}
          name="counterpartyName"
          label="Nama pihak"
          hint="Gereja lain, jemaat, atau pihak luar."
          isRequired
        >
          {(field) => (
            <Input {...field} maxLength={150} placeholder="mis. GKPI Medan" />
          )}
        </ControlField>

        <ControlField
          control={form.control}
          name="jemaatId"
          label="Jemaat (bila pihaknya jemaat)"
          isOptional
        >
          {(field) => (
            <DdlField
              id="jemaatId"
              value={field.value}
              onValueChange={field.onChange}
              options={jemaat.options}
              isLoading={jemaat.isLoading}
              disabled={isDisabled}
              placeholder="Pilih jemaat"
              emptyMessage="Belum ada jemaat"
              isClearable
            />
          )}
        </ControlField>

        <ControlField
          control={form.control}
          name="principal"
          label="Pokok pinjaman"
          isRequired
        >
          {(field) => (
            <AmountInput
              value={field.value}
              onValueChange={field.onChange}
              disabled={isDisabled}
              maxDigits={13}
              maxFraction={2}
            />
          )}
        </ControlField>

        <ControlField
          control={form.control}
          name="agreementDate"
          label="Tanggal kesepakatan"
          isRequired
        >
          {(field) => (
            <DateField
              id="agreementDate"
              value={field.value}
              onValueChange={field.onChange}
              disabled={isDisabled}
              label="Tanggal kesepakatan"
            />
          )}
        </ControlField>

        <ControlField
          control={form.control}
          name="termMonths"
          label="Jangka waktu (bulan)"
          isRequired
        >
          {(field) => (
            <Input
              {...field}
              inputMode="numeric"
              maxLength={3}
              placeholder="mis. 12"
            />
          )}
        </ControlField>
      </FormSection>

      <FormSection
        legend="Bunga"
        note="Dasarnya ikut dipilih, bukan hanya persennya: 5% atas 10 juta selama 12 bulan bernilai 500 ribu, 6 juta, atau 3,25 juta tergantung dasarnya."
        disabled={isDisabled}
      >
        <FormWide>
          <ControlField
            control={form.control}
            name="interestMode"
            label="Dasar bunga"
            isRequired
          >
            {(field) => (
              <SelectField
                value={field.value}
                onValueChange={field.onChange}
                options={INTEREST_MODE_OPTIONS}
                disabled={isDisabled}
              />
            )}
          </ControlField>
        </FormWide>

        {interestMode === "NONE" ? null : (
          <ControlField
            control={form.control}
            name="interestPercent"
            label="Bunga (%)"
            isOptional
          >
            {(field) => (
              <Input
                {...field}
                inputMode="decimal"
                maxLength={6}
                placeholder="mis. 5"
              />
            )}
          </ControlField>
        )}

        <FormWide>
          <dl className="border-hairline divide-hairline grid divide-y rounded-lg border px-4">
            {[
              ["Pokok", principal],
              ["Bunga", interest],
              ["Total kembali", principal + interest],
            ].map(([label, value]) => (
              <div
                key={label as string}
                className="flex items-center justify-between gap-3 py-2"
              >
                <dt className="text-muted-foreground text-body">{label}</dt>
                <dd className="text-body font-medium tabular-nums">
                  {formatAmount(value as number)}
                </dd>
              </div>
            ))}
          </dl>
        </FormWide>
      </FormSection>

      <FormSection legend="Catatan" disabled={isDisabled}>
        <FormWide>
          <ControlField
            control={form.control}
            name="notes"
            label="Catatan"
            isOptional
          >
            {(field) => <Textarea {...field} maxLength={500} rows={3} />}
          </ControlField>
        </FormWide>
      </FormSection>
    </>
  );
};

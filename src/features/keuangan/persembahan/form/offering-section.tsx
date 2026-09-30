"use client";

import { useWatch } from "react-hook-form";

import {
  AmountInput,
  DdlField,
  Input,
  SelectField,
} from "@/components/common/control";
import { ControlField, FormField, FormSection } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { monthOptions } from "@/lib/date";

import { ANONYMOUS, PERIOD_NOTE, toItemFromType } from "../model";
import type { OfferingTypeOption } from "../types";
import type { PersembahanForm } from "../use-persembahan-form";

import { JemaatField } from "./jemaat-field";

interface PropTypes {
  form: PersembahanForm;
  isDisabled: boolean;
}

export const OfferingSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const item = useWatch({ control: form.control, name: "items.0" });
  const types = useDdlOptions<OfferingTypeOption>("tipe-persembahan");
  const jemaatError = form.formState.errors.items?.[0]?.jemaatId?.message;

  const onPickType = (next: string) => {
    const type = types.rows.find((row) => String(row.id) === next);

    form.setValue(
      "items.0",
      type
        ? toItemFromType(type, item)
        : { ...item, typePersembahanId: next, typeName: "" },
      { shouldDirty: true },
    );
  };

  return (
    <FormSection legend="Persembahan" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="items.0.typePersembahanId"
        label="Tipe"
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={onPickType}
            options={types.options}
            isLoading={types.isLoading}
            disabled={isDisabled}
            placeholder="Pilih tipe"
            emptyMessage="Belum ada tipe persembahan"
          />
        )}
      </ControlField>

      {item.requiresJemaat ? (
        <FormField
          htmlFor="items.0.jemaatId"
          label="Jemaat"
          error={jemaatError}
        >
          <JemaatField
            form={form}
            index={0}
            id="items.0.jemaatId"
            isInvalid={Boolean(jemaatError)}
            describedBy={jemaatError ? "items.0.jemaatId-error" : undefined}
            isDisabled={isDisabled}
          />
        </FormField>
      ) : (
        <ControlField
          control={form.control}
          name="items.0.donorName"
          label="Nama pemberi"
          isOptional
          hint="Dikosongkan berarti Anonim."
        >
          {(field) => (
            <Input
              {...field}
              maxLength={100}
              autoComplete="off"
              autoCapitalize="words"
              placeholder={ANONYMOUS}
            />
          )}
        </ControlField>
      )}

      {item.hasPeriod ? (
        <ControlField
          control={form.control}
          name="items.0.period"
          label="Periode"
          hint={PERIOD_NOTE}
        >
          {(field) => (
            <SelectField
              value={field.value}
              onValueChange={field.onChange}
              options={monthOptions()}
              disabled={isDisabled}
              placeholder="Pilih bulan"
            />
          )}
        </ControlField>
      ) : null}

      <ControlField
        control={form.control}
        name="items.0.amount"
        label="Nominal (Rp)"
      >
        {(field) => (
          <AmountInput
            ref={field.ref}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            maxDigits={13}
            maxFraction={2}
          />
        )}
      </ControlField>
    </FormSection>
  );
};

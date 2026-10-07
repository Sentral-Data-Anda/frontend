"use client";

import { Controller } from "react-hook-form";

import { ChoiceField, Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { keepDigits } from "@/lib/number";

import { STATUS_OPTIONS, type RuangForm } from "./form-options";

interface PropTypes {
  form: RuangForm;
  isDisabled: boolean;
}

export const RoomSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Ruang" disabled={isDisabled}>
      <ControlField control={form.control} name="name" label="Nama">
        {(field) => (
          <Input
            {...field}
            maxLength={100}
            autoComplete="off"
            placeholder="mis. Aula Serbaguna"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="capacity"
        label="Kapasitas (orang)"
      >
        {(field) => (
          <Input
            {...field}
            onChange={(event) =>
              field.onChange(keepDigits(event.target.value, 5))
            }
            inputMode="numeric"
            autoComplete="off"
            placeholder="mis. 120"
            className="tabular-nums"
          />
        )}
      </ControlField>

      <Controller
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <div>
            <ChoiceField
              id="isActive"
              label="Status"
              value={field.value}
              onValueChange={field.onChange}
              options={STATUS_OPTIONS}
              disabled={isDisabled}
              hint="Ruang nonaktif tidak bisa dipinjam, tetapi tetap tercatat di riwayat."
            />
          </div>
        )}
      />
    </FormSection>
  );
};

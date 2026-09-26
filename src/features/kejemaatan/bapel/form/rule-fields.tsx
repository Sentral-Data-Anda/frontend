"use client";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useWatch } from "react-hook-form";

import {
  Button,
  DateField,
  Input,
  SelectField,
  optionsOf,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";

import { EMPTY_RULE } from "../model";
import {
  DAY_OF_WEEK_LABEL,
  RULE_TYPE_LABEL,
  WEEK_OF_MONTH_LABEL,
} from "../types";

import type { BapelForm } from "./form-options";

const TYPE_OPTIONS = optionsOf(RULE_TYPE_LABEL);
const DAY_OPTIONS = optionsOf(DAY_OF_WEEK_LABEL);
const WEEK_OPTIONS = optionsOf(WEEK_OF_MONTH_LABEL);

interface PropTypes {
  form: BapelForm;
  isDisabled: boolean;
}

export const RuleSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const rows = useFieldArray({ control: form.control, name: "rules" });
  const values = useWatch({ control: form.control, name: "rules" });

  return (
    <FormSection
      legend="Larangan jadwal"
      note="Badan pelayanan ini tidak dijadwalkan pada kondisi yang dilarang. Larangan sejenis cukup salah satu cocok; jenis berbeda harus cocok bersamaan, mis. Minggu dan Pekan ke-2 berarti hanya Minggu kedua. Kosongkan bila tidak ada larangan."
      disabled={isDisabled}
    >
      <FormWide className="space-y-3">
        {rows.fields.length === 0 ? null : (
          <ul className="space-y-4">
            {rows.fields.map((row, index) => (
              <li
                key={row.id}
                className="border-hairline space-y-3 rounded-control border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-body font-medium">Aturan {index + 1}</p>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Hapus aturan ${index + 1}`}
                    className="text-destructive cursor-pointer"
                    onClick={() => rows.remove(index)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>

                <ControlField
                  control={form.control}
                  name={`rules.${index}.type`}
                  label="Jenis"
                >
                  {(field) => (
                    <SelectField
                      value={field.value}
                      onValueChange={field.onChange}
                      options={TYPE_OPTIONS}
                      disabled={isDisabled}
                      placeholder="Pilih jenis aturan"
                    />
                  )}
                </ControlField>

                {values?.[index]?.type === "NO_DAY" ? (
                  <ControlField
                    control={form.control}
                    name={`rules.${index}.dayOfWeek`}
                    label="Hari"
                  >
                    {(field) => (
                      <SelectField
                        value={field.value}
                        onValueChange={field.onChange}
                        options={DAY_OPTIONS}
                        disabled={isDisabled}
                        placeholder="Pilih hari"
                      />
                    )}
                  </ControlField>
                ) : null}

                {values?.[index]?.type === "NO_DATE" ? (
                  <ControlField
                    control={form.control}
                    name={`rules.${index}.date`}
                    label="Tanggal"
                  >
                    {(field) => (
                      <DateField
                        value={field.value}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={isDisabled}
                        label="Tanggal aturan"
                      />
                    )}
                  </ControlField>
                ) : null}

                {values?.[index]?.type === "NO_WEEK" ? (
                  <ControlField
                    control={form.control}
                    name={`rules.${index}.weekOfMonth`}
                    label="Pekan"
                  >
                    {(field) => (
                      <SelectField
                        value={field.value}
                        onValueChange={field.onChange}
                        options={WEEK_OPTIONS}
                        disabled={isDisabled}
                        placeholder="Pilih pekan"
                      />
                    )}
                  </ControlField>
                ) : null}

                {values?.[index]?.type === "NO_TIME" ? (
                  <>
                    <ControlField
                      control={form.control}
                      name={`rules.${index}.startTime`}
                      label="Jam mulai"
                    >
                      {(field) => <Input {...field} type="time" />}
                    </ControlField>

                    <ControlField
                      control={form.control}
                      name={`rules.${index}.endTime`}
                      label="Jam selesai"
                    >
                      {(field) => <Input {...field} type="time" />}
                    </ControlField>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer"
          onClick={() => rows.append(EMPTY_RULE)}
        >
          <Plus aria-hidden />
          Tambah aturan
        </Button>
      </FormWide>
    </FormSection>
  );
};

"use client";

import { useWatch } from "react-hook-form";

import { Input } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";

import { attendanceOf, formatCount } from "../model";

import { type IbadahForm, toDigits } from "./form-options";

const COUNT_FIELDS = [
  { name: "maleCount", label: "Pria (dewasa)" },
  { name: "femaleCount", label: "Wanita (dewasa)" },
  { name: "childCount", label: "Anak" },
] as const;

interface PropTypes {
  form: IbadahForm;
  isDisabled: boolean;
}

export const AttendanceSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const [maleCount, femaleCount, childCount] = useWatch({
    control: form.control,
    name: ["maleCount", "femaleCount", "childCount"],
  });

  const total = attendanceOf({ maleCount, femaleCount, childCount });

  return (
    <FormSection
      legend="Jumlah hadir"
      note="Hitungan kepala di pintu, termasuk tamu. Tiga kelompok terpisah: anak tidak dihitung lagi di pria atau wanita. Boleh diisi sesudah ibadah."
      disabled={isDisabled}
    >
      {COUNT_FIELDS.map(({ name, label }) => (
        <ControlField
          key={name}
          control={form.control}
          name={name}
          label={label}
        >
          {(field) => (
            <Input
              {...field}
              onChange={(event) => field.onChange(toDigits(event.target.value))}
              inputMode="numeric"
              autoComplete="off"
              maxLength={5}
              placeholder="0"
              className="tabular-nums"
            />
          )}
        </ControlField>
      ))}

      <FormWide>
        <p aria-live="polite" className="text-body font-medium tabular-nums">
          {total > 0
            ? `Total ${formatCount(total)} orang`
            : "Belum ada yang dicatat."}
        </p>
      </FormWide>
    </FormSection>
  );
};

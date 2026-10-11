"use client";

import { DateField } from "@/components/common/control";
import { FormField } from "@/components/common/form";

import type { ReportRange } from "../types";

interface PropTypes {
  /** Awalan id field, supaya label tiap tab tetap menunjuk kontrolnya sendiri. */
  idPrefix: string;
  range: ReportRange;
  onPickFrom: (value: string) => void;
  onPickTo: (value: string) => void;
}

/** Dua tanggal yang menentukan periode sebuah laporan. */
export const PeriodFields = (props: PropTypes) => {
  const { idPrefix, range, onPickFrom, onPickTo } = props;

  return (
    <>
      <FormField label="Dari tanggal" htmlFor={`${idPrefix}-from`}>
        <DateField
          id={`${idPrefix}-from`}
          value={range.from}
          onValueChange={onPickFrom}
        />
      </FormField>

      <FormField label="Sampai tanggal" htmlFor={`${idPrefix}-to`}>
        <DateField
          id={`${idPrefix}-to`}
          value={range.to}
          onValueChange={onPickTo}
        />
      </FormField>
    </>
  );
};

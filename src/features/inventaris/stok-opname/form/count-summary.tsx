"use client";

import { useWatch } from "react-hook-form";

import { formatNumber } from "@/lib/format";

import { countSummaryOf } from "../model";

import type { OpnameForm } from "./form-options";

interface PropTypes {
  form: OpnameForm;
}

export const CountSummary = (props: PropTypes) => {
  const { form } = props;

  const lines = useWatch({ control: form.control, name: "items" });
  const { total, different, unfilled } = countSummaryOf(lines ?? []);

  return (
    <p aria-live="polite" className="text-body font-medium tabular-nums">
      {`${formatNumber(total)} barang · ${formatNumber(different)} selisih · ${formatNumber(unfilled)} belum diisi`}
    </p>
  );
};

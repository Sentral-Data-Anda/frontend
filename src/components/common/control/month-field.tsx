"use client";

import { monthLabel, monthOptions } from "@/lib/date";

import { SelectField } from "./select-field";

interface PropTypes {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  min?: string;
  max?: string;
  isClearable?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

// Bulan yang terpilih selalu ikut dirender walaupun di luar jendela
// `monthOptions` — laporan lama dibuka di form ubah, dan nilai yang hilang
// dari daftar akan terbaca sebagai field kosong lalu tersimpan kosong.
const windowOf = (value: string, min?: string, max?: string) => {
  const months = monthOptions().filter(
    (month) =>
      month.value !== value &&
      (!min || month.value >= min) &&
      (!max || month.value <= max),
  );
  const selected = value ? [{ value, label: monthLabel(value) }] : [];

  return [...selected, ...months].sort((left, right) =>
    right.value.localeCompare(left.value),
  );
};

export const MonthField = (props: PropTypes) => {
  const {
    id,
    value,
    onValueChange,
    min,
    max,
    isClearable = false,
    clearLabel = "Semua bulan",
    disabled = false,
    placeholder = "Pilih bulan",
    ...aria
  } = props;

  const options = [
    ...(isClearable ? [{ value: "", label: clearLabel }] : []),
    ...windowOf(value, min, max),
  ];

  return (
    <SelectField
      {...aria}
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={options}
      disabled={disabled}
      placeholder={placeholder}
      emptyMessage="Tidak ada bulan"
    />
  );
};

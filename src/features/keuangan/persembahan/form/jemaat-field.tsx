"use client";

import { useWatch } from "react-hook-form";

import { ComboboxField } from "@/components/common/control";
import { useDdlSearch } from "@/hooks/use-ddl-options";

import type { PersembahanForm } from "../use-persembahan-form";

interface PropTypes {
  form: PersembahanForm;
  index: number;
  id: string;
  isInvalid: boolean;
  describedBy?: string;
  isDisabled: boolean;
}

export const JemaatField = (props: PropTypes) => {
  const { form, index, id, isInvalid, describedBy, isDisabled } = props;

  const value = useWatch({
    control: form.control,
    name: `items.${index}.jemaatId`,
  });
  const name = useWatch({
    control: form.control,
    name: `items.${index}.jemaatName`,
  });
  const search = useDdlSearch(
    "jemaat",
    "id",
    value && name ? { value, label: name } : null,
  );

  const onPick = (next: string) => {
    const found = search.rows.find((row) => String(row.id) === next);

    form.setValue(`items.${index}.jemaatId`, next, { shouldDirty: true });
    form.setValue(`items.${index}.jemaatName`, found?.name ?? "", {
      shouldDirty: true,
    });
  };

  return (
    <ComboboxField
      id={id}
      value={value}
      onValueChange={onPick}
      options={search.options}
      isLoading={search.isLoading}
      onSearch={search.onSearch}
      disabled={isDisabled}
      isClearable
      placeholder="Cari nama jemaat"
      emptyMessage="Jemaat tidak ditemukan"
      aria-invalid={isInvalid || undefined}
      aria-describedby={describedBy}
    />
  );
};

"use client";

import { useId, useState, type FormEvent } from "react";

import { ChoiceField, SelectField } from "@/components/common/control";
import { Button } from "@/components/ui";

import {
  pickFilterValues,
  type FilterValues,
  type ListFilter,
} from "./list-filter";

interface PropTypes {
  filters: readonly ListFilter[];
  values: FilterValues;
  onApply: (values: FilterValues) => void;
}

export const ListFilterForm = (props: PropTypes) => {
  const { filters, values, onApply } = props;

  const [draft, setDraft] = useState(() => pickFilterValues(filters, values));
  const idPrefix = useId();

  const onPick = (key: string, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const onReset = () => setDraft(pickFilterValues(filters, {}));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply(draft);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {filters.map((filter) => {
        const id = `${idPrefix}-${filter.key}`;

        if (filter.kind === "select") {
          return (
            <div key={filter.key} className="flex flex-col gap-1.5">
              <label htmlFor={id} className="text-body font-medium">
                {filter.label}
              </label>

              <SelectField
                id={id}
                value={draft[filter.key]}
                onValueChange={(value) => onPick(filter.key, value)}
                options={filter.options}
                placeholder={
                  filter.options.find((option) => !option.value)?.label
                }
                emptyMessage={filter.emptyMessage}
              />
            </div>
          );
        }

        return (
          <ChoiceField
            key={filter.key}
            id={id}
            label={filter.label}
            value={draft[filter.key]}
            onValueChange={(value) => onPick(filter.key, value)}
            options={filter.options}
          />
        );
      })}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onReset}>
          Reset
        </Button>
        <Button type="submit">Terapkan</Button>
      </div>
    </form>
  );
};

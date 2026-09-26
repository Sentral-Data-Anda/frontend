"use client";

import { useId, useState, type FormEvent } from "react";

import { SelectField } from "@/components/common/control";
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
          <fieldset key={filter.key}>
            <legend className="mb-1.5 text-body font-medium">
              {filter.label}
            </legend>

            <div className="bg-muted flex gap-0.5 rounded-control p-0.5">
              {filter.options.map((option) => (
                <label key={option.value} className={CHOICE}>
                  <input
                    type="radio"
                    name={id}
                    value={option.value}
                    checked={draft[filter.key] === option.value}
                    onChange={() => onPick(filter.key, option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
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

const CHOICE =
  "text-muted-foreground hover:text-foreground has-checked:bg-card has-checked:text-foreground has-focus-visible:ring-ring flex h-8 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-[calc(var(--radius-control)-2px)] px-2 text-body font-medium whitespace-nowrap transition-colors select-none has-checked:shadow-sm has-focus-visible:ring-2";

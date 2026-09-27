"use client";

import { useRef } from "react";

import { SearchInput } from "@/components/common/control";
import type { ListState } from "@/hooks/use-list-params";

import { ActiveFilters } from "./active-filters";
import { listActiveFilters, type ListFilter } from "./list-filter";
import { ListFilterButton } from "./list-filter-button";

interface PropTypes {
  listParams: Pick<
    ListState,
    | "search"
    | "status"
    | "filters"
    | "onSearch"
    | "onApplyFilters"
    | "onClearFilters"
  >;
  searchLabel?: string;
  searchPlaceholder?: string;
  filters?: readonly ListFilter[];
}

export const ListToolbar = (props: PropTypes) => {
  const { listParams, searchLabel, searchPlaceholder, filters = [] } = props;

  const values = { ...listParams.filters, status: listParams.status };
  const activeFilters = listActiveFilters(filters, values);
  const rowRef = useRef<HTMLDivElement>(null);

  const focusFilterButton = () =>
    rowRef.current?.querySelector<HTMLButtonElement>("button")?.focus();

  const onRemove = (key: string) => {
    listParams.onApplyFilters({ [key]: "" });
    focusFilterButton();
  };

  const onClearAll = () => {
    listParams.onClearFilters();
    focusFilterButton();
  };

  return (
    <div className="@container px-gutter pb-4">
      <div ref={rowRef} className="flex gap-2">
        {searchLabel ? (
          <SearchInput
            value={listParams.search}
            onSearch={listParams.onSearch}
            label={searchLabel}
            placeholder={searchPlaceholder}
            className="min-w-0 flex-1 @min-[36rem]:max-w-80"
          />
        ) : null}

        {filters.length > 0 ? (
          <ListFilterButton
            filters={filters}
            values={values}
            activeCount={activeFilters.length}
            onApply={listParams.onApplyFilters}
          />
        ) : null}
      </div>

      {activeFilters.length > 0 ? (
        <ActiveFilters
          filters={activeFilters}
          onRemove={onRemove}
          onClearAll={onClearAll}
        />
      ) : null}
    </div>
  );
};

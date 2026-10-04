"use client";

import { MonthField } from "@/components/common/control";
import { DataList } from "@/components/common/list";

import { useCompliance } from "../api";
import { PENDING_EMPTY, currentMonthOf } from "../model";

import { PendingItem } from "./pending-item";

const NOTE =
  "Komisi yang tidak mencairkan apa pun bulan itu tidak wajib melapor, dan gerbang pencairan meloloskannya.";

interface PropTypes {
  month: string;
  isCanCreate: boolean;
  onPickMonth: (month: string) => void;
}

export const PendingContent = (props: PropTypes) => {
  const { month, isCanCreate, onPickMonth } = props;

  const compliance = useCompliance(month);

  return (
    <div>
      <div className="space-y-2 px-gutter pb-4">
        <div className="max-w-64">
          <label
            htmlFor="pending-month"
            className="text-muted-foreground mb-1 block text-caption"
          >
            Bulan
          </label>
          <MonthField
            id="pending-month"
            value={month}
            onValueChange={onPickMonth}
            max={currentMonthOf()}
          />
        </div>

        <p className="text-muted-foreground text-caption">{NOTE}</p>
      </div>

      <DataList
        items={compliance.data}
        getKey={(row) => row.bapel?.publicId ?? String(row.bapelId)}
        label="Kepatuhan laporan per komisi"
        isLoading={compliance.isPending}
        isRefreshing={compliance.isFetching}
        error={compliance.error}
        onRetry={() => void compliance.refetch()}
        emptyTitle={PENDING_EMPTY}
        itemNoun="komisi"
      >
        {(row) => (
          <PendingItem row={row} month={month} isCanCreate={isCanCreate} />
        )}
      </DataList>
    </div>
  );
};

"use client";

import { memo } from "react";

import { Button, ComboboxField, DateField } from "@/components/common/control";
import { Badge } from "@/components/common/display";
import { cn } from "@/lib/utils";

import { useHostOptions, useKeluargaAddress } from "../../api";
import { formatServiceDate } from "../../model";

import type { PreviewRow as Row, RowError } from "./model";

interface PropTypes {
  index: number;
  row: Row;
  isExisting: boolean;
  hostWarning: string | null;
  dateError: string | null;
  error: RowError | undefined;
  typeIbadahId: string;
  zoneChurchId: string;
  dateMax: string;
  isTable: boolean;
  isDisabled: boolean;
  onChange: (index: number, patch: Partial<Row>) => void;
}

export const PreviewRow = memo(function PreviewRow(props: PropTypes) {
  const {
    index,
    row,
    isExisting,
    hostWarning,
    dateError,
    error,
    typeIbadahId,
    zoneChurchId,
    dateMax,
    isTable,
    isDisabled,
    onChange,
  } = props;

  const hosts = useHostOptions({
    isEnabled: true,
    typeIbadahId,
    zoneChurchId,
    selected: row.hostId,
    pinned: null,
  });
  const address = useKeluargaAddress(row.hostId, Boolean(row.hostId));
  const id = `giliran-${index}`;
  const rowName = row.date ? formatServiceDate(row.date) : `baris ${index + 1}`;
  const problem: RowError | null =
    error ?? (dateError ? { field: "date", message: dateError } : null);
  const isMarked = Boolean(isExisting || problem || hostWarning);
  const messageId = problem ? `${id}-message` : undefined;
  const isDateInvalid = problem?.field === "date";
  const isHostInvalid = problem?.field === "host";
  const labelClass = isTable ? "sr-only" : "mb-1.5 block text-body font-medium";
  const cellClass = cn(
    "min-w-0 transition-opacity",
    !row.isTicked && "opacity-60 focus-within:opacity-100 hover:opacity-100",
  );

  const onRetryAddress = () => void address.refetch();

  const marks = (
    <div className="flex min-w-0 flex-col items-start gap-1.5">
      {isExisting ? <Badge variant="outline">Sudah ada</Badge> : null}

      {problem ? (
        <p id={messageId} className="text-destructive text-body">
          {problem.message}
        </p>
      ) : null}

      {hostWarning ? (
        <p className="border-warning bg-warning/10 rounded-control border px-2 py-0.5 text-caption">
          {hostWarning}
        </p>
      ) : null}
    </div>
  );

  return (
    <li
      className={cn(
        isTable
          ? "border-border col-span-full grid grid-cols-subgrid items-start gap-y-1.5 border-t px-3 py-2.5"
          : "border-border bg-card space-y-3 rounded-control border p-3",
        !row.isTicked && "bg-muted/40",
      )}
    >
      <div className={isTable ? "contents" : "flex items-start gap-2"}>
        <label
          className={cn(
            "flex size-control shrink-0 cursor-pointer items-center justify-center has-disabled:cursor-not-allowed",
            !isTable && "mt-6",
          )}
        >
          <input
            id={`${id}-tick`}
            type="checkbox"
            checked={row.isTicked}
            disabled={isDisabled}
            onChange={(event) =>
              onChange(index, { isTicked: event.target.checked })
            }
            aria-label={`Buat ibadah ${rowName}`}
            className="accent-primary size-4 cursor-pointer disabled:cursor-not-allowed"
          />
        </label>

        <div className={cn(cellClass, !isTable && "flex-1")}>
          <label htmlFor={`${id}-date`} className={labelClass}>
            Tanggal<span className="sr-only"> ibadah {rowName}</span>
          </label>
          <DateField
            id={`${id}-date`}
            value={row.date}
            onValueChange={(date) => onChange(index, { date })}
            disabled={isDisabled}
            variant="dekat"
            max={dateMax}
            label="Tanggal ibadah"
            isClearable={false}
            aria-invalid={isDateInvalid || undefined}
            aria-describedby={isDateInvalid ? messageId : undefined}
          />
        </div>
      </div>

      <div
        className={
          isTable ? "flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1.5" : ""
        }
      >
        <div className={cn(cellClass, isTable && "flex-[3_1_16rem]")}>
          <label htmlFor={`${id}-host`} className={labelClass}>
            Tuan rumah<span className="sr-only"> {rowName}</span>
          </label>
          <ComboboxField
            id={`${id}-host`}
            value={row.hostId}
            onValueChange={(hostId) => onChange(index, { hostId })}
            options={hosts.options}
            isLoading={hosts.isLoading}
            onSearch={hosts.onSearch}
            disabled={isDisabled}
            placeholder="Cari keluarga"
            emptyMessage="Belum ada data keluarga"
            aria-invalid={isHostInvalid || undefined}
            aria-describedby={isHostInvalid ? messageId : undefined}
          />

          {row.hostId && address.isError ? (
            <div className="flex flex-wrap items-center gap-x-2">
              <p className="text-destructive text-caption">
                Alamat tidak bisa dimuat.
              </p>
              <Button
                type="button"
                variant="link"
                className="px-0"
                disabled={isDisabled || address.isFetching}
                onClick={onRetryAddress}
                isLoading={address.isFetching}
              >
                {address.isFetching ? "Memuat…" : "Coba lagi"}
              </Button>
            </div>
          ) : row.hostId ? (
            <p className="text-muted-foreground mt-1.5 line-clamp-2 text-caption">
              {address.data?.address ?? "Memuat alamat…"}
            </p>
          ) : null}
        </div>

        {isTable || isMarked ? (
          <div className={isTable ? "min-w-0 flex-[1_0_14rem]" : "mt-2"}>
            {isMarked ? marks : null}
          </div>
        ) : null}
      </div>
    </li>
  );
});

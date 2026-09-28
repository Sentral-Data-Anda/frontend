"use client";

import { Button } from "@/components/common/control";

import type { PreviewRow } from "../model";

import { RepeatRow } from "./repeat-row";

export const PREVIEW_ID = "repeat-preview";

interface PropTypes {
  rows: readonly PreviewRow[] | null;
  dateCount: number;
  errors: ReadonlyMap<string, string>;
  isCheckable: boolean;
  isOverMax: boolean;
  isError: boolean;
  isFetching: boolean;
  isNoneTicked: boolean;
  isDisabled: boolean;
  onRecheck: () => void;
  onToggle: (date: string, isTicked: boolean) => void;
}

export const RepeatPreview = (props: PropTypes) => {
  const {
    rows,
    dateCount,
    errors,
    isCheckable,
    isOverMax,
    isError,
    isFetching,
    isNoneTicked,
    isDisabled,
    onRecheck,
    onToggle,
  } = props;

  const ticked = rows?.filter((row) => row.isTicked).length ?? 0;
  const clashing = rows?.filter((row) => row.clashes.length > 0).length ?? 0;

  const recheck = (label: string) => (
    <Button
      type="button"
      variant="outline"
      disabled={isDisabled || isFetching}
      onClick={onRecheck}
    >
      {isFetching ? "Memeriksa…" : label}
    </Button>
  );

  return (
    <div
      id={PREVIEW_ID}
      tabIndex={-1}
      aria-busy={isFetching || undefined}
      className="space-y-2 outline-none"
    >
      {isOverMax ? (
        <p className="text-destructive text-body">
          Paling banyak 26 tanggal. Majukan tanggal akhir.
        </p>
      ) : !isCheckable ? (
        <p className="text-muted-foreground text-caption">
          Lengkapi ruang, jam, dan tanggal untuk melihat tanggal yang bentrok.
        </p>
      ) : isError && !rows ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-destructive text-body">
            Bentrok belum bisa diperiksa.
          </p>
          {recheck("Coba lagi")}
        </div>
      ) : !rows ? (
        <ol
          aria-label="Memeriksa bentrok"
          className="border-border bg-card rounded-control border"
        >
          {Array.from({ length: Math.min(dateCount, 4) }, (_, row) => (
            <li
              key={row}
              aria-hidden
              className="border-border grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-x-1 border-t px-2 py-3.5 first:border-t-0"
            >
              <span className="bg-skeleton mx-auto block size-4 animate-pulse rounded" />
              <span className="bg-skeleton block h-3 w-3/5 animate-pulse rounded" />
            </li>
          ))}
        </ol>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p
              aria-live="polite"
              className="text-body font-medium tabular-nums"
            >
              {`${ticked} dari ${rows.length} tanggal akan disimpan · ${clashing} bentrok dilewati`}
            </p>
            {recheck("Periksa ulang")}
          </div>

          {isNoneTicked && ticked === 0 ? (
            <p className="text-destructive text-body">
              Pilih minimal satu tanggal.
            </p>
          ) : null}

          <ol className="border-border bg-card rounded-control border">
            {rows.map((row, index) => (
              <RepeatRow
                key={index}
                index={index}
                row={row}
                error={errors.get(row.date)}
                isDisabled={isDisabled}
                onToggle={onToggle}
              />
            ))}
          </ol>
        </>
      )}
    </div>
  );
};

"use client";

import Link from "next/link";

import { Button } from "@/components/common/control";
import { EmptyState } from "@/components/common/feedback";

import { useItemMovements } from "../api";
import { HISTORY_LIMIT, movementListHref } from "../model";

import { MovementRow } from "./movement-row";

interface PropTypes {
  stockItemId: number;
  code: string;
}

export const MovementList = (props: PropTypes) => {
  const { stockItemId, code } = props;

  const movements = useItemMovements(stockItemId);
  const rows = movements.data?.data;

  if (movements.error && !rows) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 py-2">
        <p className="text-destructive text-body">Riwayat stok gagal dimuat.</p>
        <Button
          type="button"
          variant="outline"
          disabled={movements.isFetching}
          onClick={() => void movements.refetch()}
          isLoading={movements.isFetching}
        >
          {movements.isFetching ? "Memuat…" : "Coba lagi"}
        </Button>
      </div>
    );
  }

  if (!rows) {
    return (
      <div role="status" aria-busy="true" className="space-y-3 py-2">
        {Array.from({ length: 3 }, (_, index) => (
          <span
            key={index}
            aria-hidden
            className="bg-skeleton block h-5 animate-pulse rounded-sm"
          />
        ))}
        <span className="sr-only">Memuat riwayat stok…</span>
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title="Belum ada mutasi." isCompact />;
  }

  return (
    <>
      <ul className="divide-hairline divide-y">
        {rows.map((movement) => (
          <MovementRow key={movement.publicId} movement={movement} />
        ))}
      </ul>

      {(movements.data?.totalData ?? 0) > HISTORY_LIMIT ? (
        <Link
          href={movementListHref(code)}
          className="text-primary mt-2 inline-flex min-h-9 cursor-pointer items-center rounded-sm text-body font-medium underline-offset-4 outline-none hover:underline focus-visible:underline"
        >
          Lihat semua mutasi
        </Link>
      ) : null}
    </>
  );
};

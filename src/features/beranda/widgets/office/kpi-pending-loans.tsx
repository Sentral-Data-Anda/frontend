"use client";

import { KpiCell } from "@/components/common/dashboard";

import { usePendingLoans } from "./data";

export const KpiPendingLoans = () => {
  const query = usePendingLoans();

  return (
    <KpiCell
      label="Peminjaman menunggu"
      value={`${query.data?.length ?? 0}`}
      hint="30 hari ke depan"
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
};

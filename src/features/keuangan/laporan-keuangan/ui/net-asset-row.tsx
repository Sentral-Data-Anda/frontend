"use client";

import { DashboardCard } from "@/components/common/dashboard";

import { NET_ASSET_CLASS_LABEL, money } from "../model";
import type { ByNetAssetClass, ReportQuery } from "../types";

interface PropTypes {
  netAssets: ByNetAssetClass | undefined;
  query: ReportQuery;
}

/**
 * Aset neto ISAK 35 di Laporan Posisi Keuangan, dipisah per kelas.
 *
 * Di samping Ekuitas, bukan menggantikannya: "ekuitas" adalah saldo akun yang
 * tercatat, sedangkan aset neto adalah ekuitas PLUS hasil periode berjalan —
 * dua angka berbeda yang keduanya benar. Mengganti labelnya saja akan membuat
 * pembaca mengira angka yang sama sudah berisi hasil periode.
 */
export const NetAssetRow = (props: PropTypes) => {
  const { netAssets, query } = props;

  return (
    <DashboardCard title="Aset neto" query={query} minHeight="min-h-12">
      <p className="text-kpi font-semibold tracking-tight tabular-nums">
        {money(netAssets?.total)}
      </p>

      <dl className="mt-2 space-y-1 text-caption">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground min-w-0">
            {NET_ASSET_CLASS_LABEL.tanpaPembatasan}
          </dt>
          <dd className="shrink-0 tabular-nums">
            {money(netAssets?.tanpaPembatasan)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground min-w-0">
            {NET_ASSET_CLASS_LABEL.denganPembatasan}
          </dt>
          <dd className="shrink-0 tabular-nums">
            {money(netAssets?.denganPembatasan)}
          </dd>
        </div>
      </dl>
    </DashboardCard>
  );
};

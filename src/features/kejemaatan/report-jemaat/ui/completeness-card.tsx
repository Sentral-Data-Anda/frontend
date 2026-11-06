"use client";

import type { UseQueryResult } from "@tanstack/react-query";

import { DashboardCard, ProgressBar } from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";

import { formatCount, formatShare, percentOf } from "../model";
import type { IncompleteReport } from "../types";

const MISSING_ALERT_PERCENT = 10;

/**
 * Setiap field yang dihitung, wajib dulu baru opsional.
 *
 * Yang `isRequired` adalah sembilan field yang menolak simpan di form jemaat
 * (`missingFieldsOf` di be-sada). Urutan wajibnya mengikuti urutan field itu
 * di popover Daftar Jemaat, jadi dua layar menyebut kekurangan yang sama
 * dengan urutan yang sama. Tiga sisanya boleh kosong — lubangnya dihitung,
 * bukan dianggap kesalahan.
 */
const FIELDS: {
  key: Exclude<keyof IncompleteReport, "total">;
  label: string;
  isRequired?: boolean;
}[] = [
  { key: "birthPlace", label: "Tanpa tempat lahir", isRequired: true },
  { key: "address", label: "Tanpa alamat lengkap", isRequired: true },
  { key: "provincesCode", label: "Tanpa provinsi", isRequired: true },
  { key: "regenciesCode", label: "Tanpa kabupaten/kota", isRequired: true },
  { key: "districtsCode", label: "Tanpa kecamatan", isRequired: true },
  { key: "villagesCode", label: "Tanpa kelurahan/desa", isRequired: true },
  {
    key: "statusMarital",
    label: "Tanpa status pernikahan",
    isRequired: true,
  },
  { key: "ethnicGroupId", label: "Tanpa suku", isRequired: true },
  { key: "codeInduk", label: "Tanpa kode induk", isRequired: true },
  { key: "birthDate", label: "Tanpa tanggal lahir" },
  { key: "lastEducation", label: "Tanpa pendidikan terakhir" },
  { key: "profession", label: "Tanpa pekerjaan" },
];

interface PropTypes {
  query: UseQueryResult<IncompleteReport>;
}

export const CompletenessCard = (props: PropTypes) => {
  const { query } = props;
  const report = query.data;

  return (
    <DashboardCard
      title="Kelengkapan data"
      query={query}
      minHeight="min-h-32"
      trailing={
        report?.total ? (
          <span className="text-muted-foreground text-body tabular-nums">
            {formatCount(report.total)} jemaat
          </span>
        ) : null
      }
    >
      {!report?.total ? (
        <EmptyState isCompact title="Belum ada data jemaat" />
      ) : (
        <>
          <ul aria-label="Kelengkapan data" className="space-y-3.5">
            {FIELDS.map((field) => (
              <li key={field.key}>
                <ProgressBar
                  label={field.label}
                  isRequired={field.isRequired}
                  value={Math.round(percentOf(report[field.key], report.total))}
                  meta={
                    report[field.key] > 0
                      ? formatShare(report[field.key], report.total)
                      : "Lengkap"
                  }
                  alertAbove={MISSING_ALERT_PERCENT}
                />
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-4 text-caption">
            <span aria-hidden className="text-destructive">
              *
            </span>{" "}
            wajib diisi — form jemaat menolak simpan selama field ini kosong.
            Status pernikahan, suku, dan kode induk hanya ditanyakan ke anggota,
            jadi persennya dihitung terhadap seluruh jemaat.
          </p>
        </>
      )}
    </DashboardCard>
  );
};

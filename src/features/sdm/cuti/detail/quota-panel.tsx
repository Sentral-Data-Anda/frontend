"use client";

import {
  DescriptionItem,
  DescriptionList,
  Panel,
} from "@/components/common/display";

import { useRemainingQuota } from "../api";
import {
  QUOTA_PENDING_NOTE,
  chargedYearOf,
  quotaSpentTextOf,
  quotaTextOf,
} from "../model";
import type { Cuti } from "../types";

interface PropTypes {
  cuti: Cuti;
}

export const QuotaPanel = (props: PropTypes) => {
  const { cuti } = props;

  // Tahun MULAI permintaan ini, bukan tahun berjalan: detail cuti 2027 yang
  // dibuka tahun ini harus melaporkan jatah 2027, dan harinya sendiri ikut.
  const quota = useRemainingQuota(
    String(cuti.karyawanId),
    String(cuti.leaveTypeId),
    chargedYearOf(cuti.startDate),
  );

  return (
    <Panel label="Jatah">
      <div className="px-gutter py-2">
        <DescriptionList>
          <DescriptionItem label="Sisa">
            {quota.isLoading
              ? "Memuat…"
              : quota.data
                ? quotaTextOf(quota.data)
                : "Gagal memuat"}
          </DescriptionItem>

          <DescriptionItem label="Terpakai" isWide>
            {quota.data ? quotaSpentTextOf(quota.data) : "—"}
          </DescriptionItem>
        </DescriptionList>

        <p className="text-muted-foreground pb-2 text-caption">
          {QUOTA_PENDING_NOTE}
        </p>
      </div>
    </Panel>
  );
};

"use client";

import { ChevronRight } from "lucide-react";

import {
  DashboardCard,
  DashboardEmpty,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard-card";
import { TimeBadge } from "@/components/common/time-badge";
import { MENU, menuHref } from "@/config/menu";

import { useIbadahByDate } from "./api";
import { findNextService, toDateKey } from "./time";

const IBADAH_HREF = menuHref(MENU.PERIBADAHAN, MENU.IBADAH);

/**
 * Ibadah hari ini, jam naik. Kotak jam ibadah berikutnya (≥ `now`, WIB)
 * berlatar; sisanya polos.
 *
 * Mandiri: mengambil datanya sendiri. Gate IBADAH VIEW di registry
 * (`widgets.tsx`); subjudul "· 2 kebaktian" di Beranda memakai query yang
 * sama — TanStack Query men-dedupe, bukan permintaan kedua.
 *
 * Belum ada layar detail ibadah, jadi baris menuju layar Ibadah. Badge
 * "1 kosong" di mockup sengaja tidak dibangun: definisi slot pelayan kosong
 * di be-sada belum konsisten.
 */
export function TodaySchedule() {
  // ponytail: dihitung sekali per render; halaman yang dibiarkan terbuka
  // melewati tengah malam tetap menampilkan kemarin sampai dimuat ulang.
  const now = new Date();
  const query = useIbadahByDate(toDateKey(now), true);
  const items = query.data ?? [];
  const next = findNextService(items, now);

  return (
    <DashboardCard
      title="Hari ini"
      actionLabel="Kalender"
      actionHref={IBADAH_HREF}
      query={query}
      minHeight="min-h-28"
    >
      {items.length === 0 ? (
        <DashboardEmpty>Tidak ada ibadah hari ini</DashboardEmpty>
      ) : (
        <DashboardList label="Ibadah hari ini">
          {items.map((item) => (
            <DashboardRow
              key={item.code}
              leading={
                <TimeBadge time={item.startTime} highlighted={item === next} />
              }
              title={item.typeIbadah.name}
              href={IBADAH_HREF}
              meta={item.preacher ?? undefined}
              trailing={
                <ChevronRight
                  className="text-muted-foreground size-4"
                  aria-hidden
                />
              }
            />
          ))}
        </DashboardList>
      )}
    </DashboardCard>
  );
}

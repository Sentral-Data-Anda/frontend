"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { DataList, DataListRow } from "@/components/common/data-list";
import { LoadingList } from "@/components/common/loading-list";
import { SectionHeader } from "@/components/common/section-header";
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
  const items = query.data;
  const next = items ? findNextService(items, now) : undefined;

  return (
    <section>
      <div className="px-gutter">
        <SectionHeader
          title="Hari ini"
          actionLabel="Kalender"
          actionHref={IBADAH_HREF}
        />
      </div>

      {query.isPending ? (
        <LoadingList rows={2} />
      ) : !query.error && items?.length === 0 ? (
        <ul>
          <DataListRow title="Tidak ada ibadah hari ini" />
        </ul>
      ) : (
        <DataList
          items={items}
          getKey={(item) => item.code}
          label="Ibadah hari ini"
          error={query.error}
          onRetry={() => void query.refetch()}
        >
          {(item) => (
            <DataListRow
              className="relative"
              leading={
                <TimeBadge time={item.startTime} highlighted={item === next} />
              }
              title={
                <Link
                  href={IBADAH_HREF}
                  className="outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                >
                  {item.typeIbadah.name}
                </Link>
              }
              meta={item.preacher ?? undefined}
              trailing={
                <ChevronRight
                  className="text-muted-foreground size-4"
                  aria-hidden
                />
              }
            />
          )}
        </DataList>
      )}
    </section>
  );
}

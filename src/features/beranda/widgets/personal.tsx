"use client";

import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard-card";
import { EmptyState } from "@/components/common/empty-state";
import { MENU, menuHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth/use-menu-access";
import { formatRupiah, formatRupiahCompact } from "@/lib/format";

import { amountOf, useMyOfferings, usePublicAnnouncements } from "../api";
import { formatDayMonth, formatMonthYear, toDateKey } from "../model";

/** `enum AnnouncementCategory` be-sada (`schema.prisma:3701-3707`). */
const CATEGORY_LABEL: Record<string, string> = {
  WARTA: "Warta",
  PENGUMUMAN: "Pengumuman",
  BERITA_DUKA: "Berita duka",
  UCAPAN_SYUKUR: "Ucapan syukur",
  KEGIATAN: "Kegiatan",
};

/**
 * Pengumuman terbaru dari `/public/announcement` (tanpa sesi — aman untuk
 * semua peran; disematkan dulu). Belum ada layar detail pengumuman, jadi
 * baris bukan tautan; "Semua" hanya untuk pemegang PENGUMUMAN VIEW.
 */
export function AnnouncementsWidget() {
  const query = usePublicAnnouncements(4);
  const access = useMenuAccess(MENU.PENGUMUMAN);
  const items = query.data ?? [];

  return (
    <DashboardCard
      title="Pengumuman"
      actionLabel={access.isCanView ? "Semua" : undefined}
      actionHref={
        access.isCanView ? menuHref(MENU.KEGIATAN, MENU.PENGUMUMAN) : undefined
      }
      query={query}
      minHeight="min-h-40"
    >
      {items.length === 0 ? (
        <EmptyState isCompact title="Belum ada pengumuman" />
      ) : (
        <DashboardList label="Pengumuman terbaru">
          {items.map((item) => (
            <DashboardRow
              key={item.id}
              title={item.title}
              meta={[
                item.isPinned ? "Disematkan" : null,
                CATEGORY_LABEL[item.category] ?? item.category,
                formatDayMonth(item.publishDate),
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
        </DashboardList>
      )}
    </DashboardCard>
  );
}

/**
 * Persembahan saya tahun ini — hanya milik user sendiri (`/persembahan/saya`,
 * tanpa izin menu). Dashboard tidak pernah menampilkan persembahan per nama
 * orang lain (dashboard-desktop.md §6, BA #4).
 */
export function MyOfferingsWidget() {
  // ponytail: tahun dihitung sekali per render (WIB).
  const year = toDateKey(new Date()).slice(0, 4);
  const query = useMyOfferings(year);
  const data = query.data;

  return (
    <DashboardCard title="Persembahan saya" query={query} minHeight="min-h-28">
      {!data || data.count === 0 ? (
        <EmptyState
          isCompact
          title={`Belum ada persembahan tercatat tahun ${year}`}
        />
      ) : (
        <>
          <p className="text-body">
            <span className="text-title font-semibold tabular-nums">
              {formatRupiah(data.total)}
            </span>{" "}
            <span className="text-muted-foreground">
              tahun {year} · {data.count} kali
            </span>
          </p>
          <DashboardList label="Persembahan terakhir">
            {data.items.slice(0, 3).map((item) => (
              <DashboardRow
                key={item.code}
                title={item.typePersembahan.name}
                meta={
                  item.period
                    ? `Periode ${formatMonthYear(item.period)}`
                    : formatDayMonth(item.receivedDate)
                }
                trailing={formatRupiahCompact(amountOf(item.amount))}
              />
            ))}
          </DashboardList>
        </>
      )}
    </DashboardCard>
  );
}

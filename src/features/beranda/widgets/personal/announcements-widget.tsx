"use client";

import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";
import { MENU, menuHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { usePublicAnnouncements } from "../../api";
import { formatDayMonth } from "../../model";

const CATEGORY_LABEL: Record<string, string> = {
  WARTA: "Warta",
  PENGUMUMAN: "Pengumuman",
  BERITA_DUKA: "Berita duka",
  UCAPAN_SYUKUR: "Ucapan syukur",
  KEGIATAN: "Kegiatan",
};

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

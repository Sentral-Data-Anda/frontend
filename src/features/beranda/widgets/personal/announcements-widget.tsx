"use client";

import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";
import { MENU, menuHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { categoryLabelOf } from "@/lib/announcement";

import { useAnnouncementFeed } from "../../api";
import { formatDayMonth } from "../../model";

export const AnnouncementsWidget = () => {
  const query = useAnnouncementFeed(4);
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
              key={item.code}
              title={item.title}
              meta={[
                item.isPinned ? "Disematkan" : null,
                categoryLabelOf(item.category),
                item.bapel?.name,
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
};

"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { EventListContent } from "./list-content";

export const EventListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.EVENT);

  return isCanView ? (
    <EventListContent />
  ) : (
    <div className="pb-6">
      <PageHeader title="Event" backHref={domainHref(MENU.KEGIATAN)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Event"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};

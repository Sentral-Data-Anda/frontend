"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { SkillMusikList } from "./skill-musik-list";

export const SkillMusikListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.SKILL_MUSIK);

  if (isCanView) return <SkillMusikList />;

  return (
    <div className="pb-6">
      <PageHeader title="Skill Musik" backHref={domainHref(MENU.PELAYANAN)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Skill Musik"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};

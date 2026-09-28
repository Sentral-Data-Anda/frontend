"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { RolePelayanList } from "./role-pelayan-list";

export const RolePelayanListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.ROLE_PELAYAN);

  if (isCanView) return <RolePelayanList />;

  return (
    <div className="pb-6">
      <PageHeader title="Role Pelayan" backHref={domainHref(MENU.PELAYANAN)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Role Pelayan"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};

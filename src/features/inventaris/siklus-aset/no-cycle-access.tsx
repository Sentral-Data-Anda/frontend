import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";

export const NoCycleAccess = () => (
  <div className="pb-8">
    <PageHeader title="Siklus Aset" backHref={domainHref(MENU.INVENTARIS)} />
    <EmptyState
      title="Anda tidak memiliki akses ke Siklus Aset"
      description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
    />
  </div>
);

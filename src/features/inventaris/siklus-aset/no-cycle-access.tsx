import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";

export const NoCycleAccess = () => (
  <div className="pb-8">
    <PageHeader
      title="Asset Transaction"
      backHref={domainHref(MENU.FIXED_ASSET)}
    />
    <EmptyState
      title="Anda tidak memiliki akses ke Asset Transaction"
      description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
    />
  </div>
);

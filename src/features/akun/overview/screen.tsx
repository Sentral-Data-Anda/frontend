import { PageHeader, shellWidthFull } from "@/components/layout";
import { cn } from "@/lib/utils";

import { LogoutSection } from "./logout-section";
import { OfferingSection } from "./offering-section";
import { ProfileSection } from "./profile-section";
import { SecuritySection } from "./security-section";

export const AccountScreen = () => (
  <div className="w-full pb-8">
    <div className={shellWidthFull}>
      <PageHeader title="Akun saya" backHref="/" />
    </div>

    <div className={cn(shellWidthFull, "@container/form")}>
      <ProfileSection />
      <SecuritySection />
      <OfferingSection />
      <LogoutSection />
    </div>
  </div>
);

import { AsideLayout } from "@/components/common/display";
import { PageHeader, shellWidthFull } from "@/components/layout";
import { cn } from "@/lib/utils";

import { OfferingSection } from "./offering-section";
import { ProfileSection } from "./profile-section";
import { SecuritySection } from "./security-section";
import { SignOutButton } from "./sign-out-button";

export const AccountScreen = () => (
  <div className={cn(shellWidthFull, "pb-8")}>
    <PageHeader title="Akun saya" backHref="/" />

    <AsideLayout
      className="px-gutter"
      aside={
        <>
          <SecuritySection />
          <OfferingSection />
          <SignOutButton />
        </>
      }
    >
      <ProfileSection />
    </AsideLayout>
  </div>
);

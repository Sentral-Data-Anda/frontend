import { PageHeader, shellWidthNarrow } from "@/components/layout";
import { cn } from "@/lib/utils";

import { OfferingSection } from "./offering-section";
import { ProfileSection } from "./profile-section";
import { SecuritySection } from "./security-section";
import { SignOutButton } from "./sign-out-button";

export const AccountScreen = () => (
  <div className={cn(shellWidthNarrow, "pb-8")}>
    <PageHeader title="Akun saya" backHref="/" />

    <div className="space-y-4 px-gutter">
      <ProfileSection />
      <SecuritySection />
      <OfferingSection />

      <div className="flex justify-end">
        <SignOutButton />
      </div>
    </div>
  </div>
);

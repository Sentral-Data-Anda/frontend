import { PageHeader } from "@/components/layout";

import { OfferingSection } from "./offering-section";
import { ProfileSection } from "./profile-section";
import { SecuritySection } from "./security-section";
import { SignOutButton } from "./sign-out-button";

export const AccountScreen = () => (
  <div className="mx-auto w-full max-w-[45rem] pb-8">
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

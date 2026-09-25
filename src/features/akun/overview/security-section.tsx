import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { FormSection, FormWide } from "@/components/common/form";
import { ACCOUNT_PASSWORD_HREF } from "@/config/menu";
import { PASSWORD_HINT } from "@/lib/password";

export const SecuritySection = () => {
  return (
    <FormSection
      isReadOnly
      legend="Keamanan"
      note="Setelah password diganti, semua perangkat keluar dan Anda masuk lagi dengan password baru."
    >
      <FormWide className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-body font-medium">Password</p>
          <p className="text-muted-foreground text-body">{PASSWORD_HINT}</p>
        </div>

        <Link
          href={ACCOUNT_PASSWORD_HREF}
          className={buttonVariants({ variant: "outline" })}
        >
          Ubah password
        </Link>
      </FormWide>
    </FormSection>
  );
};

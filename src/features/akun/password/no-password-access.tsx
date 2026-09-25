import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { PageHeader } from "@/components/layout";
import { ACCOUNT_HREF } from "@/config/menu";

export const NoPasswordAccess = () => (
  <div className="mx-auto w-full max-w-lg">
    <PageHeader
      title="Tidak bisa mengganti password"
      backHref={ACCOUNT_HREF}
      isBackPersistent
    />

    <div className="flex flex-col items-start gap-3 px-gutter">
      <p className="text-muted-foreground text-body">
        Akun ini belum boleh mengganti password sendiri. Hubungi administrator.
      </p>

      <Link
        href={ACCOUNT_HREF}
        className={buttonVariants({ variant: "outline" })}
      >
        Kembali ke Akun saya
      </Link>
    </div>
  </div>
);

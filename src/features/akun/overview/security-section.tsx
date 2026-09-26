import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { Panel } from "@/components/common/display";
import { ACCOUNT_PASSWORD_HREF } from "@/config/menu";
import { PASSWORD_HINT } from "@/lib/password";

export const SecuritySection = () => (
  <Panel label="Keamanan">
    <div className="flex items-center justify-between gap-4 px-gutter py-4">
      <div className="min-w-0">
        <p className="text-body font-medium">Password</p>
        <p className="text-muted-foreground text-caption">{PASSWORD_HINT}</p>
      </div>

      <Link
        href={ACCOUNT_PASSWORD_HREF}
        aria-label="Ubah password"
        className={buttonVariants({ variant: "outline" })}
      >
        Ubah
      </Link>
    </div>
  </Panel>
);

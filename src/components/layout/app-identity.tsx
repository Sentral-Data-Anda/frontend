import { LogoMark } from "@/components/common/brand/logo";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { SIDEBAR_MOTION } from "./sidebar-collapse";

const TONE = {
  canvas: { mark: "", eyebrow: "text-muted-foreground", role: "" },
  sidebar: {
    mark: "",
    eyebrow: "text-sidebar-muted-foreground",
    role: "text-sidebar-foreground",
  },
} as const;

export function AppIdentity({
  role,
  tone = "canvas",
  isCompact = false,
}: {
  role: string;
  tone?: keyof typeof TONE;
  isCompact?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <LogoMark className={TONE[tone].mark} />
      <div
        aria-hidden={isCompact || undefined}
        className={cn(
          "min-w-0 transition-opacity",
          SIDEBAR_MOTION,
          isCompact && "opacity-0 [&>p]:text-clip",
        )}
      >
        <p
          className={cn(
            "truncate text-caption font-medium tracking-wider uppercase",
            TONE[tone].eyebrow,
          )}
        >
          {siteConfig.shortName} · {siteConfig.name}
        </p>
        <p
          className={cn("truncate text-lead font-semibold", TONE[tone].role)}
          title={role}
        >
          {role}
        </p>
      </div>
    </div>
  );
}

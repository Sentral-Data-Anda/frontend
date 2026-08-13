import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 font-semibold", className)}
    >
      <span className="grid size-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
        GR
      </span>
      <span className="text-base">{siteConfig.shortName}</span>
    </Link>
  );
}

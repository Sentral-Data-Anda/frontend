import Image from "next/image";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-primary flex size-9 shrink-0 items-center justify-center rounded-control",
        className,
      )}
    >
      <Image
        src="/brand/logo-icon.png"
        alt=""
        width={28}
        height={28}
        sizes="28px"
        className="size-3/4"
        priority
      />
    </span>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo-wordmark.png"
      alt={siteConfig.shortName}
      width={496}
      height={232}
      sizes="160px"
      className={cn("h-auto w-24", className)}
      priority
    />
  );
}

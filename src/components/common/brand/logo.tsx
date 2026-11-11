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
      <img
        src="/brand/logo-icon.png"
        alt=""
        width={28}
        height={28}
        className="size-3/4"
        fetchPriority="high"
      />
    </span>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo-wordmark.png"
      alt={siteConfig.shortName}
      width={496}
      height={232}
      className={cn("h-auto w-24", className)}
      fetchPriority="high"
    />
  );
}

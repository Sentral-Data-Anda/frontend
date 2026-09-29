import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  backHref,
  onBack,
  isBackPersistent = false,
  leading,
  action,
}: {
  title?: string;
  subtitle?: string;
  backHref?: string;
  onBack?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  isBackPersistent?: boolean;
  leading?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header
      className={cn(
        "flex items-center gap-3 px-gutter pt-[max(1rem,env(safe-area-inset-top))] pb-3 print:hidden",
        !title && !subtitle && "lg:hidden",
      )}
    >
      <div className={isBackPersistent ? "contents" : "contents lg:hidden"}>
        {backHref ? (
          <Link
            href={backHref}
            onClick={onBack}
            aria-label="Kembali"
            className="border-border hover:bg-muted active:bg-accent focus-visible:ring-ring relative flex size-control shrink-0 items-center justify-center rounded-full border transition-colors outline-none after:absolute after:-inset-1.5 focus-visible:ring-2"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        ) : (
          leading
        )}
      </div>

      <div className="min-w-0 flex-1">
        {title ? (
          <h1 className="truncate text-lead font-semibold" title={title}>
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p
            className="text-muted-foreground truncate text-body"
            title={subtitle}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {action}
    </header>
  );
}

export function PageHeaderAdd({
  href,
  label,
  text = "Tambah",
}: {
  href: string;
  label: string;
  text?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        buttonVariants({ size: "icon" }),
        "cursor-pointer rounded-full lg:w-auto lg:gap-1.5 lg:rounded-control lg:px-3",
      )}
    >
      <Plus aria-hidden />
      <span className="hidden lg:inline">{text}</span>
    </Link>
  );
}

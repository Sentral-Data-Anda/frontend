import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { DomainIcon } from "./domain-tile";

export function MenuTile({
  href,
  domainSlug,
  domainLabel,
  icon,
  title,
  description,
}: {
  href: string;
  domainSlug: string;
  domainLabel?: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="bg-card ring-foreground/10 hover:bg-accent focus-visible:ring-ring flex h-full flex-col gap-2.5 rounded-lg p-3.5 ring-1 outline-none focus-visible:ring-2 motion-safe:transition motion-safe:active:scale-97"
      >
        <span className="flex items-center gap-2">
          <DomainIcon slug={domainSlug} icon={icon} size="sm" />

          {domainLabel ? (
            <span
              className="text-muted-foreground truncate text-caption"
              title={domainLabel}
            >
              {domainLabel}
            </span>
          ) : null}
        </span>

        <span className="min-w-0">
          <span className="block text-body font-medium">{title}</span>

          {description ? (
            <span className="text-muted-foreground mt-0.5 line-clamp-2 text-caption">
              {description}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

export function MenuTileGrid({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="@container">
      <ul
        aria-label={label}
        className="grid auto-rows-fr grid-cols-2 gap-3 @xl:grid-cols-3"
      >
        {children}
      </ul>
    </div>
  );
}

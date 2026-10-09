import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { MENU, MENU_ICON, domainEntryHref } from "@/config/menu";
import type { MenuNode } from "@/types/menu";

const TINT = {
  primary: { bg: "bg-primary-100", fg: "text-primary-900" },
  secondary: { bg: "bg-secondary-100", fg: "text-secondary-900" },
  warning: { bg: "bg-warning-100", fg: "text-warning-900" },
  success: { bg: "bg-success-100", fg: "text-success-900" },
} as const;

const tintOf = (slug: string) => TINT[DOMAIN_TINT[slug] ?? "primary"];

const DOMAIN_TINT: Record<string, keyof typeof TINT> = {
  [MENU.KEJEMAATAN]: "primary",
  [MENU.INVENTORY]: "primary",
  [MENU.APPROVAL]: "primary",
  [MENU.SETTINGS]: "primary",
  [MENU.PELAYANAN]: "secondary",
  [MENU.PROCUREMENT]: "secondary",
  [MENU.PERIBADAHAN]: "secondary",
  [MENU.KEGIATAN]: "warning",
  [MENU.FINANCE]: "warning",
  [MENU.BUDGETING]: "warning",
  [MENU.FASILITAS]: "success",
  [MENU.HR]: "success",
};

const ICON_SIZE = {
  sm: { box: "size-control rounded-control", icon: "size-4" },
  md: { box: "size-12 rounded-lg", icon: "size-5" },
} as const;

export function DomainIcon({
  slug,
  icon,
  size = "md",
  className,
}: {
  slug: string;
  icon?: LucideIcon;
  size?: keyof typeof ICON_SIZE;
  className?: string;
}) {
  const Icon = icon ?? MENU_ICON[slug];

  return (
    <span
      className={`flex shrink-0 items-center justify-center ${ICON_SIZE[size].box} ${tintOf(slug).bg} ${tintOf(slug).fg} ${className ?? ""}`}
    >
      {Icon ? <Icon className={ICON_SIZE[size].icon} aria-hidden /> : null}
    </span>
  );
}

function DomainTile({ slug, label }: { slug: string; label: string }) {
  return (
    <span className="flex flex-col items-center gap-1.5 text-center">
      <DomainIcon
        slug={slug}
        className="transition group-hover:brightness-95 group-active:brightness-90"
      />

      <span className="text-body leading-tight underline-offset-2 group-hover:underline">
        {label}
      </span>
    </span>
  );
}

export function DomainTileGrid({ domains }: { domains: MenuNode[] }) {
  return (
    <ul className="grid grid-cols-4 gap-3">
      {domains.map((domain) => (
        <li key={domain.publicId}>
          <Link
            href={domainEntryHref(domain)}
            className="group focus-visible:ring-ring block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-safe:transition motion-safe:active:scale-97"
          >
            <DomainTile slug={domain.slug} label={domain.name} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

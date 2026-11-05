import { DOMAIN_SLUGS, domainEntryHref, domainHref } from "@/config/menu";
import { findMenuNode } from "@/lib/menu-tree";
import type { MenuNode } from "@/types/menu";

export type DomainResolution =
  | { kind: "not-found" }
  | { kind: "redirect"; href: string }
  | { kind: "page"; domain: MenuNode };

export function resolveDomain(
  menu: MenuNode[],
  param: string,
): DomainResolution {
  const slug = DOMAIN_SLUGS.find((item) => domainHref(item) === `/${param}`);
  const domain = slug ? findMenuNode(menu, slug) : null;

  if (!domain || domain.children.length === 0) return { kind: "not-found" };

  const href = domainEntryHref(domain);

  return href === domainHref(domain.slug)
    ? { kind: "page", domain }
    : { kind: "redirect", href };
}

// Domain satu layar mengalihkan ke layarnya, jadi kembali ke `/<domain>` akan
// memutar balik ke layar yang sama. Induk layar itu Beranda.
export function resolveBackHref(href: string, menu: MenuNode[]): string {
  const slug = DOMAIN_SLUGS.find((item) => domainHref(item) === href);
  const domain = slug ? findMenuNode(menu, slug) : null;

  return domain?.children.length === 1 ? "/" : href;
}

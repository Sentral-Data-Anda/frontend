import { DOMAIN_SLUGS, domainEntryHref, domainHref } from "@/config/menu";
import { findMenuNode } from "@/features/auth/menu-tree";
import type { MenuNode } from "@/features/auth/types";

export type DomainResolution =
  | { kind: "not-found" }
  | { kind: "redirect"; href: string }
  | { kind: "page"; domain: MenuNode };

/**
 * Penjaga halaman `/[domain]`, dipisah dari `page.tsx` supaya bisa diuji tanpa
 * meniru `next/navigation`.
 *
 * Domain yang tidak dipegang peran diperlakukan sama dengan domain yang tidak
 * ada — 404, bukan 403 — supaya keberadaan modul tidak bocor. Domain dengan
 * satu layar dialihkan ke layar itu, juga saat dibuka lewat deep link.
 */
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

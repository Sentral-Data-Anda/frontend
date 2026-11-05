import { BERANDA_SHORTCUTS } from "@/config/menu";
import type { MenuNode } from "@/types/menu";

export const SHORTCUT_LIMIT = 8;

const isShortcut = new Set<string>(BERANDA_SHORTCUTS);

export function pickShortcuts(menu: MenuNode[]): {
  domains: MenuNode[];
  isTruncated: boolean;
} {
  const bySlug = new Map(menu.map((domain) => [domain.slug, domain] as const));

  const preferred = BERANDA_SHORTCUTS.map((slug) => bySlug.get(slug)).filter(
    (domain): domain is MenuNode => domain !== undefined,
  );

  const rest = menu.filter((domain) => !isShortcut.has(domain.slug));

  const ordered = [...preferred, ...rest];

  return {
    domains: ordered.slice(0, SHORTCUT_LIMIT),
    isTruncated: ordered.length > SHORTCUT_LIMIT,
  };
}

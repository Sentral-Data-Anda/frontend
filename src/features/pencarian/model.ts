import { MENU_DESCRIPTION, type MenuSlug } from "@/config/menu";
import type { MenuNode } from "@/types/menu";

export type ScreenHit = { domain: MenuNode; leaf: MenuNode };

export type ModuleSearch =
  | { kind: "domains"; domains: MenuNode[] }
  | { kind: "screens"; hits: ScreenHit[] };

export const descriptionOf = (leaf: MenuNode) =>
  MENU_DESCRIPTION[leaf.slug as MenuSlug];

export function searchModules(
  domains: MenuNode[],
  keyword: string,
): ModuleSearch {
  const needle = keyword.trim().replace(/\s+/g, " ").toLowerCase();

  if (!needle) return { kind: "domains", domains };

  const matches = (text: string | undefined) =>
    text?.toLowerCase().includes(needle) ?? false;

  return {
    kind: "screens",
    hits: domains.flatMap((domain) =>
      domain.children
        .filter(
          (leaf) =>
            matches(domain.name) ||
            matches(leaf.name) ||
            matches(descriptionOf(leaf)),
        )
        .map((leaf) => ({ domain, leaf })),
    ),
  };
}

import { MENU_DESCRIPTION, type MenuSlug } from "@/config/menu";
import type { MenuNode } from "@/features/auth/types";

export type ScreenHit = { domain: MenuNode; leaf: MenuNode };

export type ModuleSearch =
  | { kind: "domains"; domains: MenuNode[] }
  | { kind: "screens"; hits: ScreenHit[] };

/** Penjelasan satu layar untuk hasil pencarian dan tile domain. */
export const descriptionOf = (leaf: MenuNode) =>
  MENU_DESCRIPTION[leaf.slug as MenuSlug];

/**
 * Kata kunci kosong → grid domain apa adanya. Berisi → daftar LAYAR yang
 * cocok, supaya "keluarga" langsung memberi layarnya, bukan domain yang harus
 * ditebak lalu diketuk lagi. Layar cocok lewat namanya, penjelasannya, atau
 * nama domainnya ("keuangan" → semua layar Keuangan).
 *
 * Sumbernya `domains` (= `session.menu`), jadi layar yang tidak dipegang
 * peran tidak pernah muncul. Normalisasi kata kunci (huruf besar dari
 * autokapitalisasi ponsel, spasi berlebih) terjadi di sini, bukan di
 * pemanggil — syarat tak tertulis semacam itu akan dilewatkan pemanggil
 * berikutnya, dan hasilnya terlihat seperti "tidak ada yang cocok".
 */
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

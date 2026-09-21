import type { MenuNode } from "./types";

/**
 * Telusuri pohon menu untuk satu slug.
 *
 * Modul netral (tanpa `"use client"`, tanpa `server-only`) supaya dipakai dua
 * sisi: `useMenuAccess`/bottom tab di client, dan penjaga halaman domain di
 * server.
 */
export function findMenuNode(nodes: MenuNode[], slug: string): MenuNode | null {
  for (const node of nodes) {
    if (node.slug === slug) return node;

    const found = findMenuNode(node.children, slug);

    if (found) return found;
  }

  return null;
}

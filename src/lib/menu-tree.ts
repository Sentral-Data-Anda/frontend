import type { MenuNode } from "@/types/menu";

export function findMenuNode(nodes: MenuNode[], slug: string): MenuNode | null {
  for (const node of nodes) {
    if (node.slug === slug) return node;

    const found = findMenuNode(node.children, slug);

    if (found) return found;
  }

  return null;
}

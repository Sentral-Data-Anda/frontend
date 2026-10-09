"use client";

import { useMemo } from "react";

import type { MenuSlug } from "@/config/menu";
import { findMenuNode } from "@/lib/menu-tree";
import type { MenuAction } from "@/types/menu";

import { useSession } from "./session-provider";

/**
 * Terdengar hanya di sesi admin, dan hanya saat `next dev`.
 *
 * Pohon menu non-admin sudah tersaring ke menu yang rolenya pegang, jadi slug
 * yang tidak ketemu di situ wajar. Pohon admin tidak tersaring: dia seluruh
 * menu yang hidup. Slug yang hilang dari pohon admin berarti barisnya memang
 * tidak ada di server — `MENU` di sini dan `MENU_TREE` di be-sada sudah
 * berselisih.
 *
 * Tanpa ini selisih itu bisu: `findMenuNode` pulang undefined, `isCanView`
 * jadi false, dan layarnya menampilkan "tidak punya akses" kepada semua orang
 * termasuk admin, tanpa error di mana pun.
 */
const assertKnownSlug = (slug: MenuSlug, isKnown: boolean) => {
  if (isKnown || process.env.NODE_ENV !== "development") return;

  throw new Error(
    `Slug menu "${slug}" tidak ada di pohon menu kiriman server. ` +
      "Rename slug di fe-sada dan be-sada belum sinkron, atau menu ini " +
      "dinonaktifkan admin. Jalankan sync:menu setelah migrasi slug.",
  );
};

export function useMenuAccess(slug: MenuSlug) {
  const session = useSession();

  return useMemo(() => {
    const node = findMenuNode(session.menu, slug);

    if (session.roleUser.isAdmin) assertKnownSlug(slug, node !== undefined);

    const actions = new Set<MenuAction>(node?.action ?? []);

    return {
      isCanView: actions.has("VIEW"),
      isCanCreate: actions.has("CREATE"),
      isCanUpdate: actions.has("UPDATE"),
      isCanDelete: actions.has("DELETE"),
      isCanReset: actions.has("RESET"),
    };
  }, [session.menu, session.roleUser.isAdmin, slug]);
}

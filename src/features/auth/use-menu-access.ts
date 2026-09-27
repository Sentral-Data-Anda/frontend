"use client";

import { useMemo } from "react";

import type { MenuSlug } from "@/config/menu";
import { findMenuNode } from "@/lib/menu-tree";
import type { MenuAction } from "@/types/menu";

import { useSession } from "./session-provider";

export function useMenuAccess(slug: MenuSlug) {
  const session = useSession();

  return useMemo(() => {
    const actions = new Set<MenuAction>(
      findMenuNode(session.menu, slug)?.action ?? [],
    );

    return {
      isCanView: actions.has("VIEW"),
      isCanCreate: actions.has("CREATE"),
      isCanUpdate: actions.has("UPDATE"),
      isCanDelete: actions.has("DELETE"),
      isCanReset: actions.has("RESET"),
    };
  }, [session.menu, slug]);
}

"use client";

import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { useEventRange, useIbadahRange } from "../../api";
import { weekKeys } from "../../model";

export function useWeekAgenda() {
  const now = new Date();
  const days = weekKeys(now);
  const eventAccess = useMenuAccess(MENU.EVENT);
  const ibadah = useIbadahRange(days[0], days[6]);
  const events = useEventRange(days[0], days[6], eventAccess.isCanView);

  return { now, days, ibadah, events, isEventShown: eventAccess.isCanView };
}

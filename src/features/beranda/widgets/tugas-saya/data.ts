import { detailHref, MENU } from "@/config/menu";
import { formatDateShort, formatWeekday } from "@/lib/format";

import type { TugasSayaItem } from "../../api";

export const MAX_TASKS = 6;

export type TaskRow = {
  key: string;
  title: string;
  when: string;
  where: string;
  group: string | null;
  isToday: boolean;
  href?: string;
};

const clock = (time: string) => time.replace(":", ".");

export const toTaskRows = (
  items: readonly TugasSayaItem[],
  today: string,
  isLinked: boolean,
): TaskRow[] =>
  items.map((item, index) => ({
    key: `${item.jadwal.code}-${index}`,
    title: [item.role.name, item.musikSkill?.name].filter(Boolean).join(" · "),
    when: `${formatWeekday(item.date)} ${formatDateShort(item.date)} · ${clock(item.startTime)}–${clock(item.endTime)}`,
    where: `${item.ibadah[0]?.typeIbadah.name ?? item.jadwal.name} · ${item.bapel.name}`,
    group: item.group?.name ?? null,
    isToday: item.date.slice(0, 10) === today,
    href: isLinked
      ? detailHref(MENU.PELAYANAN, MENU.JADWAL_PELAYAN, item.jadwal.code)
      : undefined,
  }));

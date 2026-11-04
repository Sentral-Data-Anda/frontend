"use client";

import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard";
import { Badge } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { MENU, detailHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { todayJakarta } from "@/lib/date";
import { formatDateShort, formatWeekday } from "@/lib/format";

import { useTugasSayaAll, type TugasSayaItem } from "../api";

const dayOf = (iso: string) => iso.slice(0, 10);

const clock = (time: string) => time.replace(":", ".");

const titleOf = (item: TugasSayaItem) =>
  [item.role.name, item.musikSkill?.name].filter(Boolean).join(" · ");

const placeOf = (item: TugasSayaItem) =>
  item.ibadah[0]?.typeIbadah.name ?? item.jadwal.name;

const hrefOf = (item: TugasSayaItem, isCanView: boolean) =>
  isCanView
    ? detailHref(MENU.PELAYANAN, MENU.JADWAL_PELAYAN, item.jadwal.code)
    : undefined;

export const TugasSayaPanel = () => {
  const query = useTugasSayaAll();
  const access = useMenuAccess(MENU.JADWAL_PELAYAN);
  const today = todayJakarta();
  const items = query.data ?? [];

  return (
    <DashboardCard title="Tugas Saya" query={query} minHeight="min-h-48">
      {items.length === 0 ? (
        <EmptyState isCompact title="Belum ada tugas pelayanan yang tercatat" />
      ) : (
        <DashboardList label="Tugas Saya">
          {items.map((item, index) => (
            <DashboardRow
              key={`${item.jadwal.code}-${item.date}-${item.startTime}-${index}`}
              title={
                item.group ? (
                  <>
                    {titleOf(item)}
                    <span className="sr-only"> lewat </span>
                    <Badge variant="secondary" className="ml-2 align-middle">
                      {item.group.name}
                    </Badge>
                  </>
                ) : (
                  titleOf(item)
                )
              }
              meta={
                <>
                  <span className="block truncate">
                    {formatWeekday(item.date)} {formatDateShort(item.date)} ·{" "}
                    {clock(item.startTime)}–{clock(item.endTime)}
                  </span>
                  <span className="block truncate">
                    {placeOf(item)} · {item.bapel.name}
                  </span>
                </>
              }
              trailing={
                dayOf(item.date) === today ? <Badge>Hari ini</Badge> : undefined
              }
              href={hrefOf(item, access.isCanView)}
            />
          ))}
        </DashboardList>
      )}
    </DashboardCard>
  );
};

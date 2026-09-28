"use client";

import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard";
import { Badge } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { MENU, menuHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { useTugasSaya } from "../../api";
import { toDateKey } from "../../model";

import { MAX_TASKS, toTaskRows } from "./data";

const TITLE = "Tugas saya";

export const TugasSayaWidget = () => {
  const today = toDateKey(new Date());
  const query = useTugasSaya(today);
  const access = useMenuAccess(MENU.JADWAL_PELAYAN);
  const rows = toTaskRows(query.data ?? [], today, access.isCanView);
  const restCount = rows.length - MAX_TASKS;

  return (
    <DashboardCard
      title={TITLE}
      trailing={
        <span className="text-muted-foreground text-body">
          4 pekan ke depan
        </span>
      }
      actionLabel={access.isCanView ? "Buka jadwal pelayan" : undefined}
      actionHref={
        access.isCanView
          ? menuHref(MENU.PELAYANAN, MENU.JADWAL_PELAYAN)
          : undefined
      }
      query={query}
      minHeight="min-h-32"
    >
      {rows.length === 0 ? (
        <EmptyState
          isCompact
          title="Tidak ada tugas pelayanan dalam 4 pekan ke depan"
        />
      ) : (
        <>
          <DashboardList label={TITLE}>
            {rows.slice(0, MAX_TASKS).map((row) => (
              <DashboardRow
                key={row.key}
                title={row.title}
                meta={
                  <>
                    <span className="block truncate" title={row.when}>
                      {row.when}
                    </span>
                    <span className="block truncate" title={row.where}>
                      {row.where}
                    </span>
                  </>
                }
                trailing={
                  row.group || row.isToday ? (
                    <>
                      {row.group ? (
                        <Badge variant="secondary">{row.group}</Badge>
                      ) : null}
                      {row.isToday ? <Badge>Hari ini</Badge> : null}
                    </>
                  ) : undefined
                }
                href={row.href}
              />
            ))}
          </DashboardList>
          {restCount > 0 ? (
            <p className="text-muted-foreground mt-2 text-caption">
              dan {restCount} tugas lainnya
            </p>
          ) : null}
        </>
      )}
    </DashboardCard>
  );
};

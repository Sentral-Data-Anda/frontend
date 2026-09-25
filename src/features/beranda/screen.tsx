"use client";

import { useState } from "react";

import { DashboardGrid, KpiStrip } from "@/components/common/dashboard";
import { DomainTileGrid, SectionHeader } from "@/components/common/navigation";
import {
  AppIdentity,
  DashboardHeader,
  MobileOnly,
  PageHeader,
} from "@/components/layout";
import { BERANDA_SHORTCUTS, MENU } from "@/config/menu";
import { useSession, useMenuAccess } from "@/features/auth";
import { firstNameOf } from "@/lib/format";

import { useIbadahByDate } from "./api";
import { SHOW_DUMMY } from "./fixtures";
import { formatLongDate, greetingOf, toDateKey } from "./model";
import { NotificationBell } from "./ui/notification-bell";
import { ViewPicker } from "./ui/view-picker";
import { saveDashboardView, type DashboardView } from "./view";
import { selectHeaderActions, selectWidgets } from "./widgets/registry";

export function HomeScreen({ defaultView }: { defaultView?: DashboardView }) {
  const session = useSession();
  const ibadahAccess = useMenuAccess(MENU.IBADAH);
  const [pickView, setPickView] = useState<DashboardView | undefined>(
    defaultView,
  );
  const widgets = selectWidgets(session.menu, undefined, undefined, pickView);

  const now = new Date();
  const ibadah = useIbadahByDate(toDateKey(now), ibadahAccess.isCanView);

  const firstName = firstNameOf(session.jemaat?.name ?? session.username);

  const serviceCount = ibadahAccess.isCanView ? (ibadah.data?.length ?? 0) : 0;

  const shortcuts = BERANDA_SHORTCUTS.flatMap(
    (slug) => session.menu.find((domain) => domain.slug === slug) ?? [],
  );

  const bell = SHOW_DUMMY ? <NotificationBell /> : null;

  const onPickView = (next: DashboardView) => {
    saveDashboardView(next);
    setPickView(next);
  };

  return (
    <div className="pb-6">
      <PageHeader
        leading={<AppIdentity role={session.roleUser.name} />}
        action={bell}
      />

      <DashboardHeader
        title={`${greetingOf(now)}, ${firstName}`}
        subtitle={`${formatLongDate(now)}${serviceCount > 0 ? ` · ${serviceCount} kebaktian` : ""}`}
        actions={selectHeaderActions(session.menu)}
        picker={
          <ViewPicker
            value={widgets.view}
            groups={widgets.groups}
            onPick={onPickView}
          />
        }
        trailing={bell}
      />

      <div className="mt-5 px-gutter">
        <DashboardGrid
          isStacked={widgets.view === "all"}
          kpi={
            widgets.kpi.length ? (
              <KpiStrip label="Ringkasan">
                {widgets.kpi.map(({ id, Component }) => (
                  <Component key={id} />
                ))}
              </KpiStrip>
            ) : null
          }
          between={
            <MobileOnly>
              <section className="pt-2">
                <SectionHeader
                  title="Aksi cepat"
                  isTitleHidden
                  actionLabel="Tampilkan semua"
                  actionHref="/modul"
                />

                <DomainTileGrid domains={shortcuts} />
              </section>
            </MobileOnly>
          }
          main={widgets.main.map(({ id, Component }) => (
            <Component key={id} />
          ))}
          side={widgets.side.map(({ id, Component }) => (
            <Component key={id} />
          ))}
        />
      </div>
    </div>
  );
}

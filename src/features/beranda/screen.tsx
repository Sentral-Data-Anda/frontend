import { useState } from "react";

import { DashboardGrid, KpiStrip } from "@/components/common/dashboard";
import { DomainTileGrid, SectionHeader } from "@/components/common/navigation";
import {
  AccountLink,
  AppIdentity,
  DashboardBody,
  DashboardHeader,
  DashboardPage,
  MobileOnly,
  PageHeader,
} from "@/components/layout";
import { MENU } from "@/config/menu";
import { useSession, useMenuAccess } from "@/features/auth";
import { firstNameOf } from "@/lib/format";

import { useIbadahByDate } from "./api";
import { SHOW_DUMMY } from "./fixtures";
import { formatLongDate, greetingOf, toDateKey } from "./model";
import { pickShortcuts } from "./shortcuts";
import { NotificationBell } from "./ui/notification-bell";
import { ViewPicker } from "./ui/view-picker";
import {
  KPI_GROUPS,
  saveDashboardView,
  viewOfRole,
  type DashboardView,
} from "./view";
import { selectWidgets } from "./widgets/registry";

interface PropTypes {
  defaultView?: DashboardView;
}

export const HomeScreen = (props: PropTypes) => {
  const { defaultView } = props;

  const session = useSession();
  const ibadahAccess = useMenuAccess(MENU.IBADAH);
  const isAdmin = session.roleUser.isAdmin;
  const roleView = viewOfRole(session.roleUser.dashboardView ?? "UMUM");
  const [pickView, setPickView] = useState<DashboardView | undefined>(
    defaultView ?? roleView,
  );
  const view = isAdmin ? (pickView ?? roleView) : roleView;
  const widgets = selectWidgets(session.menu, undefined, undefined, view, {
    isViewLocked: !isAdmin,
    isPelayan: session.isPelayan ?? false,
  });

  const now = new Date();
  const ibadah = useIbadahByDate(toDateKey(now), ibadahAccess.isCanView);

  const firstName = firstNameOf(session.jemaat?.name ?? session.username);

  const serviceCount = ibadahAccess.isCanView ? (ibadah.data?.length ?? 0) : 0;

  const { domains: shortcuts, isTruncated } = pickShortcuts(session.menu);

  const bell = SHOW_DUMMY ? <NotificationBell /> : null;

  const onPickView = (next: DashboardView) => {
    saveDashboardView(next);
    setPickView(next);
  };

  return (
    <DashboardPage>
      <PageHeader
        leading={<AppIdentity role={session.roleUser.name} />}
        action={
          <div className="flex items-center gap-2">
            {bell}
            <AccountLink />
          </div>
        }
      />

      <DashboardHeader
        title={`${greetingOf(now)}, ${firstName}`}
        subtitle={`${formatLongDate(now)}${serviceCount > 0 ? ` · ${serviceCount} kebaktian` : ""}`}
        picker={
          <ViewPicker
            value={widgets.view}
            groups={isAdmin ? KPI_GROUPS : widgets.groups}
            onPick={onPickView}
            isAdmin={isAdmin}
          />
        }
        trailing={bell}
      />

      <DashboardBody>
        <DashboardGrid
          isFullHeight
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
            shortcuts.length ? (
              <MobileOnly>
                <section className="pt-2">
                  <SectionHeader
                    title="Aksi cepat"
                    isTitleHidden
                    actionLabel={isTruncated ? "Tampilkan semua" : undefined}
                    actionHref={isTruncated ? "/modul" : undefined}
                  />

                  <DomainTileGrid domains={shortcuts} />
                </section>
              </MobileOnly>
            ) : null
          }
          main={widgets.main.map(({ id, Component }) => (
            <Component key={id} />
          ))}
          side={widgets.side.map(({ id, Component }) => (
            <Component key={id} />
          ))}
        />
      </DashboardBody>
    </DashboardPage>
  );
};

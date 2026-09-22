"use client";

import { DashboardGrid } from "@/components/common/dashboard-grid";
import { DomainTileGrid } from "@/components/common/domain-tile";
import { KpiStrip } from "@/components/common/kpi-strip";
import { SectionHeader } from "@/components/common/section-header";
import { AppIdentity } from "@/components/layout/app-identity";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MobileOnly } from "@/components/layout/mobile-only";
import { PageHeader } from "@/components/layout/page-header";
import { BERANDA_SHORTCUTS, MENU } from "@/config/menu";
import { useSession } from "@/features/auth/session-provider";
import { useMenuAccess } from "@/features/auth/use-menu-access";
import { useIbadahByDate } from "@/features/beranda/api";
import { SHOW_DUMMY } from "@/features/beranda/dummy";
import { NotificationBell } from "@/features/beranda/notification-bell";
import { formatLongDate, greetingOf, toDateKey } from "@/features/beranda/time";
import { selectHeaderActions, selectWidgets } from "@/features/beranda/widgets";
import { firstNameOf } from "@/lib/format";

/**
 * Beranda per izin (docs/design/dashboard-desktop.md). Isinya widget dari
 * registry `features/beranda/widgets.tsx` yang gate-nya dipegang peran ini —
 * satu daftar untuk semua ukuran. Susunannya milik `DashboardGrid`
 * (container query): tumpuk di HP/tablet, dua/tiga kolom di desktop.
 *
 * Aksi cepat hanya < lg (di desktop sidebar yang menjawab). Lonceng masih
 * DUMMY dan hanya dirender di luar production — lihat
 * `features/beranda/dummy.ts`.
 */
export function HomeScreen() {
  const session = useSession();
  const ibadahAccess = useMenuAccess(MENU.IBADAH);
  const widgets = selectWidgets(session.menu);

  // ponytail: dihitung sekali per render; halaman yang dibiarkan terbuka
  // melewati tengah malam tetap menampilkan kemarin sampai dimuat ulang.
  const now = new Date();
  const ibadah = useIbadahByDate(toDateKey(now), ibadahAccess.isCanView);

  const firstName = firstNameOf(session.jemaat?.name ?? session.username);

  const serviceCount = ibadahAccess.isCanView ? (ibadah.data?.length ?? 0) : 0;

  const shortcuts = BERANDA_SHORTCUTS.flatMap(
    (slug) => session.menu.find((domain) => domain.slug === slug) ?? [],
  );

  const bell = SHOW_DUMMY ? <NotificationBell /> : null;

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
        trailing={bell}
      />

      <div className="mt-5 px-gutter">
        <DashboardGrid
          kpi={
            widgets.kpi.length ? (
              <KpiStrip label="Ringkasan" count={widgets.kpi.length}>
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

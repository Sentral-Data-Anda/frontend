"use client";

import { DomainTileGrid } from "@/components/common/domain-tile";
import { KpiStrip } from "@/components/common/kpi-strip";
import { SectionHeader } from "@/components/common/section-header";
import { AppIdentity } from "@/components/layout/app-identity";
import { PageHeader } from "@/components/layout/page-header";
import { BERANDA_SHORTCUTS, MENU } from "@/config/menu";
import { useSession } from "@/features/auth/session-provider";
import { useMenuAccess } from "@/features/auth/use-menu-access";
import { useIbadahByDate } from "@/features/beranda/api";
import { SHOW_DUMMY } from "@/features/beranda/dummy";
import { NotificationBell } from "@/features/beranda/notification-bell";
import { formatLongDate, greetingOf, toDateKey } from "@/features/beranda/time";
import { selectWidgets } from "@/features/beranda/widgets";

/**
 * Beranda per izin (docs/design/dashboard-desktop.md). Isinya daftar widget
 * dari registry `features/beranda/widgets.tsx` yang gate-nya dipegang peran
 * ini — satu daftar untuk semua ukuran; di sini ditumpuk: KPI → Aksi cepat →
 * main → samping.
 *
 * Lonceng masih DUMMY dan hanya dirender di luar production — lihat
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

  const name = session.jemaat?.name ?? session.username;
  const firstName = name.trim().split(/\s+/)[0];

  const serviceCount = ibadahAccess.isCanView ? (ibadah.data?.length ?? 0) : 0;

  const shortcuts = BERANDA_SHORTCUTS.flatMap(
    (slug) => session.menu.find((domain) => domain.slug === slug) ?? [],
  );

  return (
    <div className="pb-6">
      <PageHeader
        leading={<AppIdentity role={session.roleUser.name} />}
        action={SHOW_DUMMY ? <NotificationBell /> : null}
      />

      <section className="px-gutter">
        <h1 className="text-lead font-semibold">
          {greetingOf(now)}, {firstName}
        </h1>
        <p className="text-muted-foreground text-body tabular-nums">
          {formatLongDate(now)}
          {serviceCount > 0 ? ` · ${serviceCount} kebaktian` : null}
        </p>
      </section>

      {widgets.kpi.length ? (
        <div className="mt-5 px-gutter">
          <KpiStrip label="Ringkasan">
            {widgets.kpi.map(({ id, Component }) => (
              <Component key={id} />
            ))}
          </KpiStrip>
        </div>
      ) : null}

      <section className="mt-6 px-gutter">
        <SectionHeader
          title="Aksi cepat"
          isTitleHidden
          actionLabel="Tampilkan semua"
          actionHref="/modul"
        />

        <DomainTileGrid domains={shortcuts} />
      </section>

      <div className="mt-6 space-y-6">
        {[...widgets.main, ...widgets.side].map(({ id, Component }) => (
          <Component key={id} />
        ))}
      </div>
    </div>
  );
}

"use client";

import { DomainTileGrid } from "@/components/common/domain-tile";
import { SectionHeader } from "@/components/common/section-header";
import { AppIdentity } from "@/components/layout/app-identity";
import { PageHeader } from "@/components/layout/page-header";
import { BERANDA_SHORTCUTS, MENU } from "@/config/menu";
import { useSession } from "@/features/auth/session-provider";
import { useMenuAccess } from "@/features/auth/use-menu-access";
import { useIbadahByDate } from "@/features/beranda/api";
import { CashSummaryCard } from "@/features/beranda/cash-summary-card";
import { SHOW_DUMMY } from "@/features/beranda/dummy";
import { NotificationBell } from "@/features/beranda/notification-bell";
import { formatLongDate, greetingOf, toDateKey } from "@/features/beranda/time";
import { TodaySchedule } from "@/features/beranda/today-schedule";

/**
 * Beranda, susunan mobile & tablet. Desktop sementara memakai susunan yang
 * sama; tampilan desktop sendiri (berdampingan dengan sidebar) dirancang
 * terpisah nanti.
 *
 * Kartu kas dan lonceng masih DUMMY dan hanya dirender di luar production —
 * lihat `features/beranda/dummy.ts`.
 */
export function HomeScreen() {
  const session = useSession();
  const ibadahAccess = useMenuAccess(MENU.IBADAH);

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

      {SHOW_DUMMY ? (
        <div className="mt-5 px-gutter">
          <CashSummaryCard />
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

      {ibadahAccess.isCanView ? (
        <TodaySchedule query={ibadah} now={now} />
      ) : null}
    </div>
  );
}

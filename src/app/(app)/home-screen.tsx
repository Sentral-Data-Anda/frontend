"use client";

import Link from "next/link";

import { Avatar } from "@/components/common/avatar";
import { DomainTile } from "@/components/common/domain-tile";
import { SectionHeader } from "@/components/common/section-header";
import { PageHeader } from "@/components/layout/page-header";
import { MENU, menuHref } from "@/config/menu";
import { siteConfig } from "@/config/site";
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

  // Delapan pintasan pertama, sesuai mockup. Sisanya lewat "Tampilkan semua".
  const shortcuts = session.menu.slice(0, 8);

  return (
    <div className="pb-6">
      <PageHeader
        leading={<Avatar label={name} />}
        title={`${siteConfig.shortName} · ${siteConfig.name}`}
        subtitle={session.roleUser.name}
        action={SHOW_DUMMY ? <NotificationBell /> : null}
      />

      <section className="px-gutter">
        <p className="text-lead font-semibold">
          {greetingOf(now)}, {firstName}
        </p>
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

      <section className="mt-8 px-gutter">
        <SectionHeader
          title="Aksi cepat"
          actionLabel="Tampilkan semua"
          actionHref="/modul"
        />

        <ul className="grid grid-cols-4 gap-3">
          {shortcuts.map((domain) => {
            const firstLeaf = domain.children[0];

            return (
              <li key={domain.publicId}>
                <Link
                  href={
                    firstLeaf ? menuHref(domain.slug, firstLeaf.slug) : "/modul"
                  }
                  className="block"
                >
                  <DomainTile slug={domain.slug} label={domain.name} />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {ibadahAccess.isCanView ? <TodaySchedule query={ibadah} /> : null}
    </div>
  );
}

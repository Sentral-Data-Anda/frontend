import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { DomainTile } from "@/components/common/domain-tile";
import { MenuCard, MenuCardGrid } from "@/components/common/menu-card";
import { PageHeader } from "@/components/layout/page-header";
import {
  DOMAIN_SLUGS,
  MENU_DESCRIPTION,
  domainHref,
  menuHref,
  type MenuSlug,
} from "@/config/menu";
import { getSession } from "@/features/auth/get-session";

import { resolveDomain } from "./resolve-domain";

type Props = { params: Promise<{ domain: string }> };

/**
 * Hanya 12 slug domain yang menjadi rute. Tanpa ini segmen satu tingkat di
 * root ikut menangkap `/favicon.ico` dan sejenisnya, lalu `(app)/layout.tsx`
 * mengalihkannya ke `/login` — slug lain harus 404 sebelum layout jalan.
 *
 * TERBUKTI HANYA DITEGAKKAN `next dev`. Di production rute ini dinamis
 * (membaca cookie), sehingga tidak punya entri prerender dan Next tidak
 * menolak slug di luar daftar. Yang menjaga di production: `resolveDomain`
 * (slug asing → 404 di dalam shell) dan `src/app/favicon.ico` (satu-satunya
 * path satu segmen yang diminta browser sendiri dan lolos dari `proxy.ts`).
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return DOMAIN_SLUGS.map((slug) => ({ domain: domainHref(slug).slice(1) }));
}

async function loadDomain(param: string) {
  const session = await getSession();

  if (!session) redirect("/login");

  const result = resolveDomain(session.menu, param);

  if (result.kind === "not-found") notFound();
  if (result.kind === "redirect") redirect(result.href);

  return result.domain;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const domain = await loadDomain((await params).domain);

  return { title: domain.name };
}

/**
 * Halaman domain: daftar layar yang boleh dibuka peran ini. Sumbernya anak
 * simpul domain di `session.menu` — sama dengan sidebar dan `/modul`.
 */
export default async function Page({ params }: Props) {
  const domain = await loadDomain((await params).domain);

  return (
    <div className="pb-6">
      <PageHeader title={domain.name} backHref="/" />

      <section className="flex justify-center px-gutter pt-2 pb-6">
        <DomainTile
          slug={domain.slug}
          label={domain.name}
          meta={`${domain.children.length} layar`}
          size="lg"
        />
      </section>

      <div className="px-gutter">
        <MenuCardGrid label={`Layar ${domain.name}`}>
          {domain.children.map((leaf) => (
            <MenuCard
              key={leaf.publicId}
              href={menuHref(domain.slug, leaf.slug)}
              iconSlug={domain.slug}
              title={leaf.name}
              description={MENU_DESCRIPTION[leaf.slug as MenuSlug]}
            />
          ))}
        </MenuCardGrid>
      </div>
    </div>
  );
}

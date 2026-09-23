import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { DOMAIN_SLUGS, domainHref } from "@/config/menu";
import { loadDomain } from "@/features/domain/api";
import { DomainScreen } from "@/features/domain/screen";

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await loadDomain((await params).domain)).name };
}

export default async function Page({ params }: Props) {
  const domain = await loadDomain((await params).domain);

  return (
    <PageContainer>
      <DomainScreen domain={domain} />
    </PageContainer>
  );
}

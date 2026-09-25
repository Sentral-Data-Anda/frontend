import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { DOMAIN_SLUGS, domainHref } from "@/config/menu";
import { loadDomain } from "@/features/domain/api";
import { DomainScreen } from "@/features/domain/screen";

type Props = { params: Promise<{ domain: string }> };

// Hanya ditegakkan `next dev`; di production dijaga `resolveDomain`.
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

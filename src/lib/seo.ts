import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

/**
 * Helper membangun metadata per halaman secara konsisten
 * (title template, Open Graph, canonical).
 */
export function buildMetadata({
  title,
  description,
  path = "/",
}: {
  title?: string;
  description?: string;
  path?: string;
}): Metadata {
  const resolvedTitle = title ?? siteConfig.name;
  const resolvedDescription = description ?? siteConfig.description;
  const url = new URL(path, siteConfig.url).toString();

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: { canonical: url },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url,
      siteName: siteConfig.name,
      locale: "id_ID",
      type: "website",
    },
  };
}

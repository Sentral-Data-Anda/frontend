import type { MetadataRoute } from "next";

import { mainNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return mainNav.map((item) => ({
    url: new URL(item.href, siteConfig.url).toString(),
    lastModified: now,
    changeFrequency: "weekly",
    priority: item.href === "/" ? 1 : 0.7,
  }));
}

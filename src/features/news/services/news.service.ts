import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

import type { News } from "../types/news.types";

// ISR: berita di-cache 5 menit. Sesuaikan bila perlu.
const REVALIDATE_SECONDS = 300;

export function getNewsList() {
  return apiClient<News[]>(ENDPOINTS.news, {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["news"] },
  });
}

export function getNewsBySlug(slug: string) {
  return apiClient<News>(ENDPOINTS.newsBySlug(slug), {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["news", `news:${slug}`] },
  });
}

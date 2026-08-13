import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

import type { Announcement } from "../types/announcement.types";

const REVALIDATE_SECONDS = 300;

export function getAnnouncements() {
  return apiClient<Announcement[]>(ENDPOINTS.announcements, {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["announcements"] },
  });
}

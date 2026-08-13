import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

import type { WorshipSchedule } from "../types/schedule.types";

// Jadwal jarang berubah — cache 1 jam.
const REVALIDATE_SECONDS = 3600;

export function getSchedules() {
  return apiClient<WorshipSchedule[]>(ENDPOINTS.schedules, {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["schedules"] },
  });
}

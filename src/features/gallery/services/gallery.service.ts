import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

import type { GalleryItem } from "../types/gallery.types";

const REVALIDATE_SECONDS = 3600;

export function getGalleries() {
  return apiClient<GalleryItem[]>(ENDPOINTS.galleries, {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["galleries"] },
  });
}

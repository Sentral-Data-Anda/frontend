/**
 * Kumpulan path endpoint API eksternal di satu tempat.
 * Sesuaikan dengan kontrak API dari aplikasi pengelola data.
 */
export const ENDPOINTS = {
  news: "/news",
  newsBySlug: (slug: string) => `/news/${slug}`,
  schedules: "/schedules",
  galleries: "/galleries",
  announcements: "/announcements",
} as const;

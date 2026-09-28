export const ANNOUNCEMENT_CATEGORIES = [
  "WARTA",
  "PENGUMUMAN",
  "BERITA_DUKA",
  "UCAPAN_SYUKUR",
  "KEGIATAN",
] as const;

export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number];

export const ANNOUNCEMENT_CATEGORY_LABEL: Record<AnnouncementCategory, string> =
  {
    WARTA: "Warta",
    PENGUMUMAN: "Pengumuman",
    BERITA_DUKA: "Berita duka",
    UCAPAN_SYUKUR: "Ucapan syukur",
    KEGIATAN: "Kegiatan",
  };

export const categoryLabelOf = (category: string) =>
  ANNOUNCEMENT_CATEGORY_LABEL[category as AnnouncementCategory] ?? category;

export const ANNOUNCEMENT_STATUSES = [
  "DRAF",
  "TERJADWAL",
  "TERBIT",
  "KEDALUWARSA",
] as const;

export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];

export const ANNOUNCEMENT_STATUS_LABEL: Record<AnnouncementStatus, string> = {
  DRAF: "Draf",
  TERJADWAL: "Terjadwal",
  TERBIT: "Terbit",
  KEDALUWARSA: "Kedaluwarsa",
};

const PRIVATE_CATEGORIES: readonly AnnouncementCategory[] = [
  "BERITA_DUKA",
  "UCAPAN_SYUKUR",
];

export type AnnouncementDates = {
  isPublished: boolean;
  publishDate: string;
  expiryDate: string | null;
};

const dayOf = (value: string) => value.slice(0, 10);

// Cermin `statusOf` be-sada: draf lebih dulu, tanggal berakhir = hari terakhir tayang.
export const announcementStatusOf = (
  announcement: AnnouncementDates,
  today: string,
): AnnouncementStatus => {
  if (!announcement.isPublished) return "DRAF";
  if (dayOf(announcement.publishDate) > today) return "TERJADWAL";
  if (announcement.expiryDate && dayOf(announcement.expiryDate) < today) {
    return "KEDALUWARSA";
  }

  return "TERBIT";
};

export const isWebsiteAnnouncement = (announcement: {
  category: string;
  isChurchWide: boolean;
}) =>
  announcement.isChurchWide &&
  !PRIVATE_CATEGORIES.includes(announcement.category as AnnouncementCategory);

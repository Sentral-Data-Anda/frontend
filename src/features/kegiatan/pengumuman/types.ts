import type {
  AnnouncementCategory,
  AnnouncementStatus,
} from "@/lib/announcement";
import type { ServerAttachment } from "@/types/attachment";

export type AnnouncementBapel = { id: number; code: string; name: string };

export type Announcement = {
  publicId: string;
  code: string;
  category: AnnouncementCategory;
  title: string;
  content: string;
  publishDate: string;
  expiryDate: string | null;
  isPublished: boolean;
  isPinned: boolean;
  bapel: AnnouncementBapel | null;
  listImage: ServerAttachment[];
  status: AnnouncementStatus;
};

export type AnnouncementSaved = { code: string };

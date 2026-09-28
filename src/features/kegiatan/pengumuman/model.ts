import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_CATEGORY_LABEL,
  ANNOUNCEMENT_STATUS_LABEL,
  ANNOUNCEMENT_STATUSES,
  announcementStatusOf,
  isWebsiteAnnouncement,
  type AnnouncementStatus,
} from "@/lib/announcement";
import { FetchError } from "@/lib/api/fetcher";
import {
  fromServerAttachment,
  keptAttachments,
  newAttachments,
} from "@/lib/attachment";
import { toDateInput, todayJakarta } from "@/lib/date";
import { toFormData } from "@/lib/form-data";
import { formatDateShort } from "@/lib/format";
import type { AttachmentValue } from "@/types/attachment";

import type { Announcement } from "./types";

export const PENGUMUMAN_LIST_PATH = menuHref(MENU.KEGIATAN, MENU.PENGUMUMAN);

export const MAX_ATTACHMENTS = 4;

export const CATEGORY_OPTIONS = ANNOUNCEMENT_CATEGORIES.map((value) => ({
  value,
  label: ANNOUNCEMENT_CATEGORY_LABEL[value],
}));

export const STATUS_OPTIONS = ANNOUNCEMENT_STATUSES.map((value) => ({
  value,
  label: ANNOUNCEMENT_STATUS_LABEL[value],
}));

export const STATUS_BADGE: Record<
  AnnouncementStatus,
  "success" | "wait" | "neutral"
> = {
  TERBIT: "success",
  TERJADWAL: "wait",
  DRAF: "neutral",
  KEDALUWARSA: "neutral",
};

export const announcementFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(4, "Isi judul, minimal 4 karakter")
      .max(200, "Judul maksimal 200 karakter"),
    category: z
      .enum(ANNOUNCEMENT_CATEGORIES)
      .or(z.literal(""))
      .refine(Boolean, "Kategori wajib dipilih"),
    content: z.string().trim().min(1, "Isi pengumuman wajib diisi"),
    bapelId: z.string(),
    publishDate: z.string().min(1, "Tanggal terbit wajib diisi"),
    expiryDate: z.string(),
    isPublished: z.enum(["true", "false"]),
    isPinned: z.enum(["true", "false"]),
    listImage: z
      .array(z.custom<AttachmentValue>())
      .max(MAX_ATTACHMENTS, `Lampiran maksimal ${MAX_ATTACHMENTS} berkas`),
  })
  .refine(
    (values) =>
      !values.expiryDate ||
      !values.publishDate ||
      values.expiryDate >= values.publishDate,
    {
      path: ["expiryDate"],
      message: "Tanggal berakhir tidak boleh sebelum tanggal terbit",
    },
  );

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

export const emptyAnnouncementForm = (
  today: string = todayJakarta(),
): AnnouncementFormValues => ({
  title: "",
  category: "PENGUMUMAN",
  content: "",
  bapelId: "",
  publishDate: today,
  expiryDate: "",
  isPublished: "false",
  isPinned: "false",
  listImage: [],
});

export const toAnnouncementForm = (
  announcement: Announcement,
): AnnouncementFormValues => ({
  title: announcement.title,
  category: announcement.category,
  content: announcement.content,
  bapelId: announcement.bapel ? String(announcement.bapel.id) : "",
  publishDate: toDateInput(announcement.publishDate),
  expiryDate: toDateInput(announcement.expiryDate),
  isPublished: announcement.isPublished ? "true" : "false",
  isPinned: announcement.isPinned ? "true" : "false",
  listImage: announcement.listImage.map(fromServerAttachment),
});

export const toAnnouncementBody = (
  values: AnnouncementFormValues,
  isEdit: boolean,
): FormData =>
  toFormData(
    {
      title: values.title.trim(),
      content: values.content.trim(),
      category: values.category,
      publishDate: values.publishDate,
      expiryDate: values.expiryDate,
      bapelId: values.bapelId,
      isPublished: values.isPublished === "true",
      isPinned: values.isPinned === "true",
      keepFiles: isEdit
        ? JSON.stringify(keptAttachments(values.listImage))
        : null,
    },
    newAttachments(values.listImage).map((item) => ({
      field: "image",
      file: item.file,
      showOnWebsite: item.showOnWebsite,
    })),
  );

const ATTACHMENT_PATH = /^(listImage|keepFiles)\b/;

// be-sada melaporkan lampiran lewat `listImage` atau `keepFiles…`; form hanya punya `listImage`.
export const toFormError = (error: unknown) =>
  error instanceof FetchError
    ? new FetchError(
        error.status,
        error.message,
        error.issues.map((issue) => ({
          ...issue,
          path: ATTACHMENT_PATH.test(issue.path) ? "listImage" : issue.path,
        })),
        error.code,
      )
    : error;

export const periodOf = (announcement: Announcement) => {
  const start = formatDateShort(announcement.publishDate);
  const end = announcement.expiryDate
    ? formatDateShort(announcement.expiryDate)
    : start;

  return end === start ? start : `${start} s.d. ${end}`;
};

export const isOnWebsite = (announcement: Announcement) =>
  announcement.status === "TERBIT" &&
  isWebsiteAnnouncement({
    category: announcement.category,
    isChurchWide: announcement.bapel === null,
  });

type PreviewInput = Pick<
  AnnouncementFormValues,
  "category" | "bapelId" | "publishDate" | "expiryDate" | "isPublished"
>;

export type StatusPreview = {
  status: AnnouncementStatus;
  timing: string;
  reach: string | null;
};

const timingOf = (status: AnnouncementStatus, values: PreviewInput) => {
  const start = formatDateShort(values.publishDate);
  const end = values.expiryDate ? formatDateShort(values.expiryDate) : "";

  if (status === "DRAF") return "belum tampil di mana pun.";
  if (status === "KEDALUWARSA") return "tanggal berakhir sudah lewat.";
  if (values.expiryDate === values.publishDate) {
    return status === "TERBIT"
      ? "tampil hari ini saja."
      : `tampil ${start} saja.`;
  }
  if (status === "TERBIT") {
    return end ? `tampil sekarang sampai ${end}.` : "tampil sekarang.";
  }

  return end ? `tampil ${start} sampai ${end}.` : `tampil mulai ${start}.`;
};

const reachOf = (
  status: AnnouncementStatus,
  values: PreviewInput,
  bapelName: string,
) => {
  if (status === "KEDALUWARSA") return null;

  const isWebsite = isWebsiteAnnouncement({
    category: values.category,
    isChurchWide: !values.bapelId,
  });
  const reason = values.bapelId
    ? `pengumuman untuk ${bapelName}`
    : "berita duka dan ucapan syukur tidak dimuat di website";
  const reach = isWebsite
    ? "tampil di aplikasi dan website gereja."
    : `hanya tampil di aplikasi: ${reason}.`;

  return status === "DRAF"
    ? `Bila diterbitkan, ${reach}`
    : `${reach[0].toUpperCase()}${reach.slice(1)}`;
};

export const statusPreviewOf = (
  values: PreviewInput,
  bapelName: string,
  today: string = todayJakarta(),
): StatusPreview | null => {
  if (!values.publishDate) return null;

  const status = announcementStatusOf(
    {
      isPublished: values.isPublished === "true",
      publishDate: values.publishDate,
      expiryDate: values.expiryDate || null,
    },
    today,
  );

  return {
    status,
    timing: timingOf(status, values),
    reach: reachOf(status, values, bapelName),
  };
};

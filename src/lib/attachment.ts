import type {
  AttachmentAccept,
  AttachmentValue,
  ServerAttachment,
} from "@/types/attachment";

export const MAX_UPLOAD_BYTES = 10_000_000;

// URL lampiran be-sada berlaku 15 menit; baca ulang sebelum kedaluwarsa.
export const MEDIA_REFETCH_MS = 10 * 60 * 1000;

const TYPES: Record<AttachmentAccept, readonly string[]> = {
  image: ["image/jpeg", "image/png"],
  "image-pdf": ["image/jpeg", "image/png", "application/pdf"],
};

export const acceptOf = (accept: AttachmentAccept) => TYPES[accept].join(",");

export const isPdf = (mimeType: string) => mimeType === "application/pdf";

const isHeic = (file: File) =>
  file.type === "image/heic" ||
  file.type === "image/heif" ||
  /\.hei[cf]$/i.test(file.name);

export const rejectionOf = (
  file: File,
  accept: AttachmentAccept,
): string | null => {
  if (isHeic(file)) {
    return "Foto HEIC belum didukung. Simpan sebagai JPG lalu pilih lagi.";
  }
  if (!TYPES[accept].includes(file.type)) {
    return accept === "image"
      ? "Pilih berkas JPG atau PNG"
      : "Pilih berkas JPG, PNG, atau PDF";
  }
  if (file.size > MAX_UPLOAD_BYTES) return "Ukuran berkas maksimal 10 MB";

  return null;
};

export const fromServerAttachment = (
  attachment: ServerAttachment,
): AttachmentValue => ({
  key: attachment.publicId,
  name: attachment.name,
  mimeType: attachment.mimeType,
  url: attachment.url,
  showOnWebsite: attachment.showOnWebsite,
  file: null,
});

export const newAttachments = (value: readonly AttachmentValue[]) =>
  value.filter(
    (item): item is AttachmentValue & { file: File } => item.file !== null,
  );

export const keptAttachments = (value: readonly AttachmentValue[]) =>
  value
    .filter((item) => item.file === null)
    .map((item) => ({
      publicId: item.key,
      showOnWebsite: item.showOnWebsite,
    }));

export const withFreshUrls = (
  value: readonly AttachmentValue[],
  server: readonly ServerAttachment[],
): AttachmentValue[] =>
  value.map((item) => {
    const fresh =
      item.file === null
        ? server.find((attachment) => attachment.publicId === item.key)
        : undefined;

    return fresh ? { ...item, url: fresh.url } : item;
  });

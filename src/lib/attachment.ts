import type {
  AttachmentAccept,
  AttachmentValue,
  ServerAttachment,
} from "@/types/attachment";

export const MAX_UPLOAD_BYTES = 10_000_000;

// URL lampiran be-sada berlaku 15 menit; baca ulang sebelum kedaluwarsa.
export const MEDIA_REFETCH_MS = 10 * 60 * 1000;

// be-sada mengubah setiap gambar menjadi WebP terkompresi, jadi semua jenis
// gambar boleh dipilih. SVG ditolak di be-sada; di sini ditolak lebih awal.
const ACCEPT: Record<AttachmentAccept, string> = {
  image: "image/*,.heic,.heif",
  "image-pdf": "image/*,.heic,.heif,application/pdf",
};

export const acceptOf = (accept: AttachmentAccept) => ACCEPT[accept];

export const isPdf = (mimeType: string) => mimeType === "application/pdf";

// Sebagian browser tidak memberi tipe MIME untuk HEIC/HEIF; kenali dari nama.
const IMAGE_EXTENSION = /\.(hei[cf]|avif|jpe?g|png|gif|webp|tiff?|bmp)$/i;

const isImage = (file: File) =>
  file.type === ""
    ? IMAGE_EXTENSION.test(file.name)
    : file.type.startsWith("image/") && file.type !== "image/svg+xml";

export const rejectionOf = (
  file: File,
  accept: AttachmentAccept,
): string | null => {
  const isAllowed =
    isImage(file) || (accept === "image-pdf" && isPdf(file.type));

  if (!isAllowed) {
    return accept === "image"
      ? "Pilih berkas gambar"
      : "Pilih berkas gambar atau PDF";
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

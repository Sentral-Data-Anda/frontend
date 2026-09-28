/**
 * Penyimpanan berkas tiruan MinIO untuk grup Kegiatan (docs/design/kegiatan/README.md
 * §4a TL-7). Berkas hidup di memori selama proses; seed = SVG buatan.
 *
 *   MOCK_MEDIA_EXPIRED=1 → semua `/media/*` 403 (tautan bertanda tangan kedaluwarsa)
 *
 * Bentuk lampiran = bentuk be-sada sesudah gap B1:
 * `{ publicId, name, mimeType, size, showOnWebsite, url }`.
 */
import type { ServerAttachment } from "../../src/types/attachment";

import { json } from "./kit";

type Stored = { bytes: ArrayBuffer | string; type: string };

const API_PORT = Number(process.env.MOCK_API_PORT ?? 3001);

export const MEDIA = new Map<string, Stored>();

export const mediaUrl = (path: string) =>
  `http://localhost:${API_PORT}/media/${path}?X-Amz-Expires=900`;

export type AttachmentRow = {
  publicId: string;
  ownerType: "Event" | "Gallery" | "Announcement";
  ownerId: number;
  path: string;
  name: string;
  mimeType: string;
  size: number;
  showOnWebsite: boolean;
};

export const attachmentOf = (row: AttachmentRow): ServerAttachment => ({
  publicId: row.publicId,
  name: row.name,
  mimeType: row.mimeType,
  size: row.size,
  showOnWebsite: row.showOnWebsite,
  url: mediaUrl(row.path),
});

const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const seedImage = (
  path: string,
  label: string,
  hue: number,
  shape: "landscape" | "portrait" | "square" = "landscape",
) => {
  const [width, height] =
    shape === "landscape"
      ? [1200, 800]
      : shape === "portrait"
        ? [800, 1200]
        : [1000, 1000];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 55% 62%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 45% 32%)"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${width * 0.78}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.14}" fill="hsl(${hue} 80% 92% / .55)"/><text x="50%" y="88%" fill="white" font-family="sans-serif" font-size="${Math.round(width / 18)}" text-anchor="middle">${escapeXml(label)}</text></svg>`;

  MEDIA.set(path, { bytes: svg, type: "image/svg+xml" });

  return svg.length;
};

const PDF =
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";

export const seedPdf = (path: string) => {
  MEDIA.set(path, { bytes: PDF, type: "application/pdf" });

  return PDF.length;
};

const ALLOWED = [
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/heic",
  "application/pdf",
];
const MAX_BYTES = 10_000_000;
const MAX_COUNT: Record<string, number> = { image: 4, mainImage: 1 };

const multerError = (error: string, status = 400) =>
  json({ status, error }, status);

type UploadEntry = { field: string; type: string; size: number };

// Urutan penolakan meniru multer be-sada: field, jumlah, tipe (415), ukuran.
export const multerRejection = (files: UploadEntry[]): Response | null => {
  const counts: Record<string, number> = {};

  for (const [index, file] of files.entries()) {
    counts[file.field] = (counts[file.field] ?? 0) + 1;

    if (counts[file.field] > (MAX_COUNT[file.field] ?? 0)) {
      return multerError("Unexpected field");
    }
    if (index >= 5) return multerError("Too many files");
    if (!ALLOWED.includes(file.type)) {
      return multerError("Unsupported file type", 415);
    }
    if (file.size > MAX_BYTES) return multerError("File too large");
  }

  return null;
};

export const readMultipart = async (
  request: Request,
): Promise<FormData | Response> => {
  const form = await request.formData();
  const files = [...form.entries()]
    .filter(([, entry]) => typeof entry !== "string")
    .map(([field, entry]) => {
      const file = entry as unknown as File;

      return { field, type: file.type, size: file.size };
    });

  return multerRejection(files) ?? form;
};

export const filesOf = (form: FormData, field: string) =>
  form
    .getAll(field)
    .filter((value) => typeof value !== "string") as unknown as File[];

// be-sada: nama asli tanpa ekstensi, objek disimpan ulang sebagai `<uuid>.jpeg|pdf`.
export const putMedia = async (file: File, folder: string) => {
  const extension = file.type === "application/pdf" ? "pdf" : "jpeg";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;

  MEDIA.set(path, {
    bytes: await file.arrayBuffer(),
    type: file.type,
  });

  return {
    path,
    name: file.name.split(".")[0],
    mimeType: file.type,
    size: file.size,
  };
};

export const serveMedia = (path: string): Response | null => {
  if (!path.startsWith("/media/")) return null;

  if (process.env.MOCK_MEDIA_EXPIRED) {
    return new Response(
      "<Error><Code>AccessDenied</Code><Message>Request has expired</Message></Error>",
      {
        status: 403,
        headers: { "content-type": "application/xml" },
      },
    );
  }

  const stored = MEDIA.get(decodeURIComponent(path.slice("/media/".length)));

  if (!stored) {
    return new Response("<Error><Code>NoSuchKey</Code></Error>", {
      status: 404,
      headers: { "content-type": "application/xml" },
    });
  }

  return new Response(stored.bytes, {
    headers: {
      "content-type": stored.type,
      "cache-control": "private, max-age=900",
    },
  });
};

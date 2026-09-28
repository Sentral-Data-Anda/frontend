import { z } from "zod";

import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import { newAttachments } from "@/lib/attachment";
import { toFormData } from "@/lib/form-data";
import { normalizeName } from "@/lib/name";
import type { AttachmentValue } from "@/types/attachment";

import type { Album } from "./types";

export const MAX_PHOTOS = 4;

export const GALERI_LIST_PATH = menuHref(MENU.KEGIATAN, MENU.GALERI);

export const GALERI_CREATE_PATH = createHref(MENU.KEGIATAN, MENU.GALERI);

export const galeriDetailHref = (code: string) =>
  detailHref(MENU.KEGIATAN, MENU.GALERI, code);

export const galeriEditHref = (code: string) =>
  editHref(MENU.KEGIATAN, MENU.GALERI, code);

export const galeriFormSchema = z
  .object({
    name: z
      .string()
      .transform(normalizeName)
      .pipe(
        z
          .string()
          .min(4, "Isi nama album, minimal 4 karakter")
          .max(100, "Nama album maksimal 100 karakter"),
      ),
    bapelId: z.string().min(1, "Pilih badan pelayanan"),
    isPublish: z.enum(["true", "false"]),
    isPickingPhotos: z.boolean(),
    listImage: z.array(z.custom<AttachmentValue>()).max(MAX_PHOTOS),
  })
  .superRefine((values, context) => {
    if (values.isPickingPhotos && values.listImage.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["listImage"],
        message: "Pilih minimal satu foto",
      });
    }
  });

export type GaleriFormValues = z.infer<typeof galeriFormSchema>;

export const EMPTY_GALERI_FORM: GaleriFormValues = {
  name: "",
  bapelId: "",
  isPublish: "false",
  isPickingPhotos: true,
  listImage: [],
};

export const toGaleriForm = (album: Album): GaleriFormValues => ({
  name: album.name,
  bapelId: String(album.bapel.id),
  isPublish: album.isPublish ? "true" : "false",
  isPickingPhotos: false,
  listImage: [],
});

export const toGaleriFormData = (values: GaleriFormValues) =>
  toFormData(
    {
      name: normalizeName(values.name),
      bapelId: values.bapelId,
      isPublish: values.isPublish === "true",
    },
    values.isPickingPhotos
      ? newAttachments(values.listImage).map((item) => ({
          field: "image",
          file: item.file,
          showOnWebsite: item.showOnWebsite,
        }))
      : [],
  );

export const websiteCountOf = (photos: readonly { showOnWebsite: boolean }[]) =>
  photos.filter((photo) => photo.showOnWebsite).length;

export const websiteStatusOf = (
  isPublish: boolean,
  photos: readonly { showOnWebsite: boolean }[],
): string | null => {
  const checked = websiteCountOf(photos);

  if (photos.length === 0) return null;
  if (checked === 0) return "Belum ada foto yang dicentang tampil di website.";
  if (!isPublish) {
    return `${checked} dari ${photos.length} foto dicentang, tetapi baru tampil di website sesudah album terbit.`;
  }

  return `${checked} dari ${photos.length} foto tampil di website.`;
};

export const websiteCellOf = (album: Album) =>
  album.isPublish
    ? `${websiteCountOf(album.listImage)} dari ${album.listImage.length}`
    : null;

export const albumMetaOf = (album: Album) =>
  `${album.listImage.length} foto · ${album.bapel.name}`;

export const replaceDescriptionOf = (count: number) =>
  `Apakah Anda ingin menyimpan perubahan data album ini? Semua foto lama akan diganti dengan ${count} foto baru.`;

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof GaleriFormValues, string?]
> = [
  [
    /sudah tersedia/i,
    "name",
    "Album dengan nama ini sudah ada. Pakai nama lain.",
  ],
  [
    /(bapel|badan pelayanan) tidak ditemukan/i,
    "bapelId",
    "Badan pelayanan ini sudah tidak ada. Pilih yang lain.",
  ],
  [/unsupported file type/i, "listImage", "Pilih berkas JPG atau PNG"],
  [/file too large/i, "listImage", "Ukuran berkas maksimal 10 MB"],
  [
    /unexpected field|too many files|maksimal 4|lebih dari 4/i,
    "listImage",
    "Maksimal 4 foto",
  ],
  [/foto/i, "listImage"],
];

export function serverFieldError(
  message: string,
): { field: keyof GaleriFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message: override ?? message };
  }

  return null;
}

/**
 * State mock bersama grup Kegiatan (docs/design/kegiatan/README.md §4a TL-7).
 * Setiap handler hanya mengubah lariknya sendiri; membaca larik lain boleh.
 * Hapus = isi `deletedAt`. Tanggal relatif hari ini (WIB).
 *
 * Yang sengaja disiapkan:
 * - empat event Beranda lama tetap bernama dan bertanggal sama;
 * - Retret Pemuda berbayar (Rp350.000) dengan pendaftar menunggu bayar, lunas,
 *   dan kedaluwarsa; Konser Natal berbayar tanpa pendaftar (harga masih bisa diubah);
 * - Latihan Paduan Suara penuh (3/3); Seminar Keluarga draf; Donor Darah lampau;
 *   Sekolah Minggu Kreatif sedang berlangsung; foto Bazar Natal hilang (gagal muat);
 * - Josephine (jemaat 10) tanpa nomor telepon (B15);
 * - pengumuman: empat status, lima kategori, satu per komisi; empat teratas
 *   feed = empat baris widget Beranda lama.
 */
import {
  announcementStatusOf,
  isWebsiteAnnouncement,
} from "../../src/lib/announcement";
import { addDays, todayJakarta } from "../../src/lib/date";
import { DDL_JEMAAT, ROOM_ROWS } from "../mock-dashboard";

import { attachmentOf, seedImage, seedPdf, type AttachmentRow } from "./media";
import { bapelKey, bapelOf, isLive, jemaatOf, nextId } from "./pelayanan-store";

export { bapelKey, bapelOf, isLive, jemaatOf, nextId };

type Live = { id: number; deletedAt: string | null };

export type EventRow = Live & {
  publicId: string;
  code: string;
  name: string;
  description: string;
  isIndoor: boolean;
  location: string | null;
  roomId: number | null;
  capacity: number;
  isPaid: boolean;
  price: string | null;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string | null;
  urlForm: string | null;
  isPublish: boolean;
  bapelId: number;
};

export type PaymentRow = {
  code: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "FAILED" | "CANCELLED";
  amount: string;
  invoiceUrl: string | null;
  expiredAt: string | null;
};

export type RegistrationStatus =
  "PENDING_PAYMENT" | "CONFIRMED" | "EXPIRED" | "CANCELLED";

export type RegistrationRow = {
  id: number;
  publicId: string;
  code: string;
  eventId: number;
  jemaatId: number | null;
  participantName: string;
  participantPhone: string;
  participantEmail: string | null;
  status: RegistrationStatus;
  payment: PaymentRow | null;
  createdAt: string;
};

export type GalleryRow = Live & {
  publicId: string;
  code: string;
  name: string;
  isPublish: boolean;
  bapelId: number;
};

export type AnnouncementRow = Live & {
  publicId: string;
  code: string;
  category: string;
  title: string;
  content: string;
  publishDate: string;
  expiryDate: string | null;
  isPublished: boolean;
  isPinned: boolean;
  bapelId: number | null;
};

export const TODAY = todayJakarta();

const day = (offset: number) => addDays(TODAY, offset);

const iso = (key: string) => `${key}T00:00:00.000Z`;

const uuid = (group: string, id: number) =>
  `00000000-0000-4000-${group}-${String(id).padStart(12, "0")}`;

const YEAR = TODAY.slice(0, 4);

export const eventCodeOf = (bapelId: number, sequence: number) =>
  `EVN_${bapelKey(bapelId)}-${YEAR}-${String(sequence).padStart(4, "0")}`;

export const galleryCodeOf = (bapelId: number, sequence: number) =>
  `ALBM_${bapelKey(bapelId)}-${String(sequence).padStart(4, "0")}`;

export const announcementCodeOf = (sequence: number) =>
  `PGM-${YEAR}-${String(sequence).padStart(4, "0")}`;

export const registrationCodeOf = (sequence: number) =>
  `REG-${YEAR}-${String(sequence).padStart(4, "0")}`;

export const paymentCodeOf = (sequence: number) =>
  `PAY-${YEAR}-${String(sequence).padStart(4, "0")}`;

const MAJELIS = 1;
const PEMUDA = 2;
const WANITA = 3;
const ANAK = 4;
const MUSIK = 5;
const DIAKONIA = 6;

const GEDUNG = 1;
const AULA = 2;
const RUANG_PEMUDA = 3;

export const JEMAAT_PHONE: Record<number, string | null> = Object.fromEntries(
  DDL_JEMAAT.map((row) => [
    row.id,
    row.id === 10 ? null : `08121000${String(row.id).padStart(4, "0")}`,
  ]),
);

export const ATTACHMENT: AttachmentRow[] = [];

const attach = (
  ownerType: AttachmentRow["ownerType"],
  ownerId: number,
  label: string,
  options: {
    hue?: number;
    shape?: "landscape" | "portrait" | "square";
    showOnWebsite?: boolean;
    isPdf?: boolean;
    isMissing?: boolean;
  } = {},
) => {
  const index = ATTACHMENT.length + 1;
  const folder = {
    Event: "event",
    Gallery: "gallery",
    Announcement: "announcement",
  }[ownerType];
  const path = `${folder}/seed-${index}.${options.isPdf ? "pdf" : "jpeg"}`;
  const size = options.isMissing
    ? 250_000
    : options.isPdf
      ? seedPdf(path)
      : seedImage(path, label, options.hue ?? index * 47, options.shape);

  ATTACHMENT.push({
    publicId: uuid("a000", index),
    ownerType,
    ownerId,
    path,
    name: label,
    mimeType: options.isPdf ? "application/pdf" : "image/jpeg",
    size,
    showOnWebsite: options.showOnWebsite ?? false,
  });
};

export const attachmentsOf = (
  ownerType: AttachmentRow["ownerType"],
  ownerId: number,
) =>
  ATTACHMENT.filter(
    (row) => row.ownerType === ownerType && row.ownerId === ownerId,
  );

// be-sada `replaceSlot`: berkas lama pemilik itu diganti seluruhnya.
export const replaceAttachments = (
  ownerType: AttachmentRow["ownerType"],
  ownerId: number,
  rows: AttachmentRow[],
) => {
  const kept = ATTACHMENT.filter(
    (row) => !(row.ownerType === ownerType && row.ownerId === ownerId),
  );

  ATTACHMENT.splice(0, ATTACHMENT.length, ...kept, ...rows);
};

const event = (
  id: number,
  sequence: number,
  fields: Omit<
    EventRow,
    "id" | "publicId" | "code" | "deletedAt" | "description" | "urlForm"
  > & {
    description?: string;
    urlForm?: string | null;
  },
): EventRow => ({
  id,
  publicId: uuid("e000", id),
  code: eventCodeOf(fields.bapelId, sequence),
  description: `${fields.name} untuk jemaat dan simpatisan. Informasi lengkap di sekretariat.`,
  urlForm: null,
  deletedAt: null,
  ...fields,
});

const indoor = (roomId: number) => ({ isIndoor: true, roomId, location: null });
const outdoor = (location: string) => ({
  isIndoor: false,
  roomId: null,
  location,
});
const free = { isPaid: false, price: null };
const paid = (price: string) => ({ isPaid: true, price });

export const EVENT: EventRow[] = [
  event(1, 1, {
    name: "Rapat Majelis",
    bapelId: MAJELIS,
    ...indoor(GEDUNG),
    capacity: 30,
    ...free,
    startDate: day(1),
    endDate: day(1),
    startTime: "19:00",
    endTime: "21:00",
    isPublish: true,
  }),
  event(2, 1, {
    name: "Retret Pemuda",
    bapelId: PEMUDA,
    ...outdoor("Parapat, Danau Toba"),
    capacity: 40,
    ...paid("350000.00"),
    startDate: day(2),
    endDate: day(4),
    startTime: "07:00",
    endTime: "17:00",
    isPublish: true,
    urlForm: "https://forms.gle/retret-pemuda",
  }),
  event(3, 1, {
    name: "Latihan Paduan Suara",
    bapelId: MUSIK,
    ...indoor(AULA),
    capacity: 3,
    ...free,
    startDate: day(3),
    endDate: day(3),
    startTime: "18:30",
    endTime: "20:30",
    isPublish: true,
  }),
  event(4, 1, {
    name: "Bazar Natal",
    bapelId: WANITA,
    ...outdoor("Halaman Gereja"),
    capacity: 200,
    ...free,
    startDate: day(5),
    endDate: day(5),
    startTime: "08:00",
    endTime: "14:00",
    isPublish: true,
  }),
  event(5, 1, {
    name: "Sekolah Minggu Kreatif",
    bapelId: ANAK,
    ...indoor(RUANG_PEMUDA),
    capacity: 25,
    ...free,
    startDate: day(-1),
    endDate: day(1),
    startTime: "09:00",
    endTime: "12:00",
    isPublish: true,
  }),
  event(6, 1, {
    name: "Seminar Keluarga Kristen",
    bapelId: DIAKONIA,
    ...indoor(GEDUNG),
    capacity: 150,
    ...free,
    startDate: day(21),
    endDate: day(21),
    startTime: "09:00",
    endTime: null,
    isPublish: false,
  }),
  event(7, 2, {
    name: "Donor Darah",
    bapelId: DIAKONIA,
    ...indoor(AULA),
    capacity: 50,
    ...free,
    startDate: day(-20),
    endDate: day(-20),
    startTime: "08:00",
    endTime: "12:00",
    isPublish: true,
  }),
  event(8, 2, {
    name: "Konser Natal",
    bapelId: MUSIK,
    ...indoor(GEDUNG),
    capacity: 300,
    ...paid("50000.00"),
    startDate: day(40),
    endDate: day(40),
    startTime: "18:00",
    endTime: "20:30",
    isPublish: true,
  }),
];

attach("Event", 1, "Rapat Majelis", { hue: 210 });
attach("Event", 2, "Retret Pemuda", { hue: 170 });
attach("Event", 3, "Latihan Paduan Suara", { hue: 280, shape: "portrait" });
attach("Event", 4, "Bazar Natal", { isMissing: true });
attach("Event", 5, "Sekolah Minggu Kreatif", { hue: 40 });
attach("Event", 6, "Seminar Keluarga", { hue: 330 });
attach("Event", 7, "Donor Darah", { hue: 0, shape: "square" });
attach("Event", 8, "Konser Natal", { hue: 120 });

const INVOICE_TTL_MS = 60 * 60 * 1000;

const registration = (
  id: number,
  eventId: number,
  who: number | { name: string; phone: string; email?: string },
  status: RegistrationStatus,
  payment: PaymentRow["status"] | null = null,
): RegistrationRow => {
  const jemaat = typeof who === "number" ? jemaatOf(who) : undefined;
  const price = EVENT.find((row) => row.id === eventId)?.price ?? "0";
  const createdAt = new Date(Date.now() - (20 - id) * 86_400_000).toISOString();

  return {
    id,
    publicId: uuid("r000", id),
    code: registrationCodeOf(id),
    eventId,
    jemaatId: jemaat?.id ?? null,
    participantName: jemaat?.name ?? (who as { name: string }).name,
    participantPhone:
      (jemaat ? JEMAAT_PHONE[jemaat.id] : (who as { phone: string }).phone) ??
      "",
    participantEmail: typeof who === "number" ? null : (who.email ?? null),
    status,
    payment: payment
      ? {
          code: paymentCodeOf(id),
          status: payment,
          amount: price,
          invoiceUrl: `https://checkout-staging.xendit.co/web/mock-${id}`,
          expiredAt:
            payment === "PENDING"
              ? new Date(Date.now() + INVOICE_TTL_MS).toISOString()
              : createdAt,
        }
      : null,
    createdAt,
  };
};

export const REGISTRATION: RegistrationRow[] = [
  registration(1, 2, 1, "PENDING_PAYMENT", "PENDING"),
  registration(2, 2, 2, "CONFIRMED", "PAID"),
  registration(
    3,
    2,
    {
      name: "Yohana Siregar",
      phone: "081377001122",
      email: "yohana@example.com",
    },
    "EXPIRED",
    "EXPIRED",
  ),
  registration(4, 2, 3, "CONFIRMED", "PAID"),
  registration(5, 3, 6, "CONFIRMED"),
  registration(6, 3, 8, "CONFIRMED"),
  registration(
    7,
    3,
    { name: "Maria Lumbantobing", phone: "081299887766" },
    "CONFIRMED",
  ),
  registration(8, 1, 4, "CONFIRMED"),
  registration(9, 1, 11, "CANCELLED"),
  registration(
    10,
    5,
    { name: "Ruth Pardede", phone: "082166554433" },
    "CONFIRMED",
  ),
  registration(11, 7, 7, "CONFIRMED"),
  registration(
    12,
    7,
    {
      name: "Samuel Hutabarat",
      phone: "081311223344",
      email: "samuel@example.com",
    },
    "CONFIRMED",
  ),
  registration(13, 7, 12, "CANCELLED"),
  registration(14, 4, 9, "CONFIRMED"),
];

// be-sada: tagihan yang lewat masih memegang kursi 5 menit (callback terlambat).
export const SEAT_GRACE_MS = 5 * 60 * 1000;

export const isLapsed = (row: RegistrationRow, now = Date.now()) =>
  row.status === "PENDING_PAYMENT" &&
  (row.payment?.status !== "PENDING" ||
    Date.parse(row.payment.expiredAt ?? "") + SEAT_GRACE_MS <= now);

// Status yang dibaca be-sada: PENDING_PAYMENT yang lewat tenggang tampil EXPIRED.
export const readStatusOf = (
  row: RegistrationRow,
  now = Date.now(),
): RegistrationStatus => (isLapsed(row, now) ? "EXPIRED" : row.status);

export const isHoldingSeat = (row: RegistrationRow, now = Date.now()) =>
  row.status === "CONFIRMED" ||
  (row.status === "PENDING_PAYMENT" && !isLapsed(row, now));

export const holdersOf = (eventId: number, now = Date.now()) =>
  REGISTRATION.filter(
    (row) => row.eventId === eventId && isHoldingSeat(row, now),
  ).length;

const roomOf = (id: number | null) =>
  ROOM_ROWS.find((row) => row.id === id) ?? null;

export const eventView = (row: EventRow) => {
  const image = attachmentsOf("Event", row.id)[0];

  return {
    id: row.id,
    publicId: row.publicId,
    code: row.code,
    name: row.name,
    description: row.description,
    isIndoor: row.isIndoor,
    location: row.location,
    capacity: row.capacity,
    isPaid: row.isPaid,
    price: row.price,
    startDate: iso(row.startDate),
    endDate: iso(row.endDate),
    startTime: row.startTime,
    endTime: row.endTime,
    urlForm: row.urlForm,
    isPublish: row.isPublish,
    programId: null,
    bapel: bapelOf(row.bapelId) ?? null,
    room: roomOf(row.roomId),
    image: image ? attachmentOf(image) : null,
    registeredCount: holdersOf(row.id),
  };
};

// Sesudah B9: rentang bersinggungan, boleh satu sisi; `isPublish`; `order=desc`.
export const listEvents = (params: URLSearchParams) => {
  const filter = (params.get("filter") ?? "").toLowerCase();
  const start = params.get("startDate");
  const end = params.get("endDate");
  const bapelId = Number(params.get("bapelId")) || null;
  const roomId = Number(params.get("roomId")) || null;
  const isPublish = params.get("isPublish");
  const isDesc = params.get("order") === "desc";

  return EVENT.filter(isLive)
    .filter(
      (row) =>
        !filter ||
        row.name.toLowerCase().includes(filter) ||
        row.code.toLowerCase().includes(filter),
    )
    .filter((row) => !start || row.endDate >= start.slice(0, 10))
    .filter((row) => !end || row.startDate <= end.slice(0, 10))
    .filter((row) => bapelId === null || row.bapelId === bapelId)
    .filter((row) => roomId === null || row.roomId === roomId)
    .filter(
      (row) =>
        isPublish === null ||
        row.isPublish === (isPublish === "1" || isPublish === "true"),
    )
    .sort((a, b) =>
      isDesc
        ? b.startDate.localeCompare(a.startDate) || b.id - a.id
        : a.startDate.localeCompare(b.startDate) || a.id - b.id,
    )
    .map(eventView);
};

const gallery = (
  id: number,
  sequence: number,
  name: string,
  bapelId: number,
  isPublish: boolean,
): GalleryRow => ({
  id,
  publicId: uuid("c000", id),
  code: galleryCodeOf(bapelId, sequence),
  name,
  isPublish,
  bapelId,
  deletedAt: null,
});

export const GALLERY: GalleryRow[] = [
  gallery(1, 1, "Retret Pemuda 2025", PEMUDA, true),
  gallery(2, 1, "Paskah 2026", MAJELIS, true),
  gallery(3, 1, "Sekolah Minggu Juli", ANAK, true),
  gallery(4, 1, "Bazar Diakonia", DIAKONIA, false),
  gallery(5, 1, "Latihan Paduan Suara", MUSIK, true),
];

attach("Gallery", 1, "Api unggun", { hue: 20, showOnWebsite: true });
attach("Gallery", 1, "Foto bersama", { hue: 190, showOnWebsite: true });
attach("Gallery", 1, "Sesi pagi", { hue: 60, shape: "portrait" });
attach("Gallery", 1, "Perjalanan pulang", { hue: 220 });
attach("Gallery", 2, "Ibadah subuh", { hue: 300, showOnWebsite: true });
attach("Gallery", 2, "Paduan suara", {
  hue: 260,
  showOnWebsite: true,
  shape: "portrait",
});
attach("Gallery", 2, "Salib", {
  hue: 350,
  showOnWebsite: true,
  shape: "square",
});
attach("Gallery", 3, "Mewarnai", { hue: 90 });
attach("Gallery", 3, "Bernyanyi", { hue: 130 });
attach("Gallery", 4, "Stan makanan", { hue: 30, showOnWebsite: true });
attach("Gallery", 4, "Kasir", { hue: 10 });
attach("Gallery", 4, "Pengunjung", { hue: 200, showOnWebsite: true });
attach("Gallery", 4, "Panitia", { hue: 160, shape: "portrait" });
attach("Gallery", 5, "Latihan", { hue: 280, showOnWebsite: true });

export const galleryView = (row: GalleryRow) => ({
  id: row.id,
  publicId: row.publicId,
  code: row.code,
  name: row.name,
  isPublish: row.isPublish,
  bapel: bapelOf(row.bapelId) ?? null,
  listImage: attachmentsOf("Gallery", row.id).map(attachmentOf),
});

const announcement = (
  id: number,
  title: string,
  category: string,
  publish: number,
  fields: Partial<
    Pick<AnnouncementRow, "isPublished" | "isPinned" | "bapelId">
  > & {
    expiry?: number;
  } = {},
): AnnouncementRow => ({
  id,
  publicId: uuid("b000", id),
  code: announcementCodeOf(id),
  category,
  title,
  content: `${title}.\n\nInformasi lebih lanjut dapat ditanyakan ke sekretariat gereja pada jam kerja.`,
  publishDate: day(publish),
  expiryDate: fields.expiry === undefined ? null : day(fields.expiry),
  isPublished: fields.isPublished ?? true,
  isPinned: fields.isPinned ?? false,
  bapelId: fields.bapelId ?? null,
  deletedAt: null,
});

export const ANNOUNCEMENT: AnnouncementRow[] = [
  announcement(1, "Warta Jemaat Minggu Ini", "WARTA", 0, { isPinned: true }),
  announcement(2, "Retret Pemuda 2026", "KEGIATAN", -2, { expiry: 4 }),
  announcement(3, "Perubahan jam Ibadah Minggu II", "PENGUMUMAN", -4),
  announcement(4, "Ucapan syukur Keluarga Manurung", "UCAPAN_SYUKUR", -6),
  announcement(5, "Berita duka: Bpk. Gideon Tampubolon", "BERITA_DUKA", -9),
  announcement(6, "Rapat pengurus Komisi Pemuda", "PENGUMUMAN", -12, {
    bapelId: PEMUDA,
  }),
  announcement(7, "Jadwal ibadah Natal 2026", "WARTA", 10),
  announcement(8, "Pendaftaran katekisasi dibuka", "PENGUMUMAN", -3, {
    isPublished: false,
  }),
  announcement(9, "Ibadah Paskah 2026", "KEGIATAN", -60, { expiry: -30 }),
];

attach("Announcement", 1, "Warta Minggu", { isPdf: true });
attach("Announcement", 2, "Poster Retret", {
  hue: 170,
  shape: "portrait",
  showOnWebsite: true,
});
attach("Announcement", 2, "Rundown internal", { isPdf: true });

const byFeedOrder = (a: AnnouncementRow, b: AnnouncementRow) =>
  Number(b.isPinned) - Number(a.isPinned) ||
  b.publishDate.localeCompare(a.publishDate) ||
  b.id - a.id;

export const announcementView = (row: AnnouncementRow) => ({
  id: row.id,
  publicId: row.publicId,
  code: row.code,
  category: row.category,
  title: row.title,
  content: row.content,
  publishDate: iso(row.publishDate),
  expiryDate: row.expiryDate ? iso(row.expiryDate) : null,
  isPublished: row.isPublished,
  isPinned: row.isPinned,
  bapel: row.bapelId === null ? null : (bapelOf(row.bapelId) ?? null),
  listImage: attachmentsOf("Announcement", row.id).map(attachmentOf),
  status: announcementStatusOf(
    {
      isPublished: row.isPublished,
      publishDate: row.publishDate,
      expiryDate: row.expiryDate,
    },
    todayJakarta(),
  ),
});

const visibleAnnouncements = () =>
  ANNOUNCEMENT.filter(isLive)
    .filter((row) => announcementView(row).status === "TERBIT")
    .sort(byFeedOrder);

// Sesudah perubahan be-sada "feed": semua TERBIT, semua kategori dan komisi.
export const announcementFeed = (limit: number) =>
  visibleAnnouncements()
    .slice(0, limit)
    .map((row) => ({
      code: row.code,
      category: row.category,
      title: row.title,
      content: row.content,
      publishDate: iso(row.publishDate),
      expiryDate: row.expiryDate ? iso(row.expiryDate) : null,
      isPinned: row.isPinned,
      bapel:
        row.bapelId === null
          ? null
          : { name: bapelOf(row.bapelId)?.name ?? "" },
      files: attachmentsOf("Announcement", row.id).map((file) => {
        const { name, mimeType, url } = attachmentOf(file);
        return { name, mimeType, url };
      }),
    }));

// `/public/announcement`: hanya seluruh jemaat, tanpa berita duka/ucapan syukur.
export const publicAnnouncements = (limit: number) =>
  visibleAnnouncements()
    .filter((row) =>
      isWebsiteAnnouncement({
        category: row.category,
        isChurchWide: row.bapelId === null,
      }),
    )
    .slice(0, limit)
    .map((row) => ({
      id: row.publicId,
      category: row.category,
      title: row.title,
      content: row.content,
      publishDate: iso(row.publishDate),
      isPinned: row.isPinned,
      files: attachmentsOf("Announcement", row.id)
        .filter((file) => file.showOnWebsite)
        .map((file) => ({ name: file.name, url: attachmentOf(file).url })),
    }));

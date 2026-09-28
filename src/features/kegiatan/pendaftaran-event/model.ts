import { z } from "zod";

import { optionsOf, type SelectOption } from "@/components/common/control";
import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";
import { formatDate, formatDateShort, formatRupiah } from "@/lib/format";

import {
  REGISTRATION_STATUS_LABEL,
  type EventOption,
  type RegistrationDetail,
  type RegistrationEvent,
  type RegistrationPayload,
} from "./types";

export const PENDAFTARAN_LIST_PATH = menuHref(
  MENU.KEGIATAN,
  MENU.PENDAFTARAN_EVENT,
);

export const PENDAFTARAN_CREATE_PATH = createHref(
  MENU.KEGIATAN,
  MENU.PENDAFTARAN_EVENT,
);

export const EVENT_LIST_PATH = menuHref(MENU.KEGIATAN, MENU.EVENT);

export const registrationHref = (code: string) =>
  detailHref(MENU.KEGIATAN, MENU.PENDAFTARAN_EVENT, code);

export const eventEditHref = (code: string) =>
  editHref(MENU.KEGIATAN, MENU.EVENT, code);

export const listHrefOf = (eventId: string) =>
  eventId
    ? `${PENDAFTARAN_LIST_PATH}?event=${encodeURIComponent(eventId)}`
    : PENDAFTARAN_LIST_PATH;

export const createHrefOf = (eventId: string) =>
  eventId
    ? `${PENDAFTARAN_CREATE_PATH}?event=${encodeURIComponent(eventId)}`
    : PENDAFTARAN_CREATE_PATH;

export const STATUS_OPTIONS = optionsOf(REGISTRATION_STATUS_LABEL);

export const maskPhone = (phone: string) => {
  const text = phone.trim();

  if (/[*•]/.test(text)) return text.replace(/\*/g, "•");
  if (text.length <= 8) return `••••${text.slice(-2)}`;

  return `${text.slice(0, 4)}••••${text.slice(-4)}`;
};

export const priceOf = (price: string | null) =>
  price === null ? null : formatRupiah(Number(price));

export const isEventFull = (event: EventOption) =>
  event.isFull === true || event.registeredCount >= event.capacity;

export const seatsLeftOf = (event: EventOption) =>
  Math.max(0, event.capacity - event.registeredCount);

export const quotaTextOf = (event: EventOption) =>
  [
    `${Math.min(event.registeredCount, event.capacity)} dari ${event.capacity} kursi terisi`,
    isEventFull(event) ? "Penuh" : null,
    event.isPaid && event.price ? `${priceOf(event.price)} per peserta` : null,
  ]
    .filter(Boolean)
    .join(" · ");

export const filterOptionOf = (event: EventOption): SelectOption => ({
  value: String(event.id),
  label: event.name,
  hint: formatDateShort(event.startDate),
});

export const formOptionOf = (event: EventOption): SelectOption => {
  const isFull = isEventFull(event);

  return {
    value: String(event.id),
    label: event.name,
    hint: [
      formatDateShort(event.startDate),
      isFull ? "Penuh" : `sisa ${seatsLeftOf(event)} kursi`,
      event.isPaid ? priceOf(event.price) : null,
    ]
      .filter(Boolean)
      .join(" · "),
    isDisabled: isFull,
  };
};

export const formatEventTime = (
  event: Pick<RegistrationEvent, "startDate" | "endDate" | "startTime"> & {
    endTime?: string | null;
  },
) => {
  const isOneDay = event.startDate.slice(0, 10) === event.endDate.slice(0, 10);
  const date = isOneDay
    ? formatDate(event.startDate)
    : `${formatDateShort(event.startDate)} – ${formatDateShort(event.endDate)}`;
  const time = event.endTime
    ? `${event.startTime}–${event.endTime}`
    : event.startTime;

  return `${date}, ${time}`;
};

export const cancelReasonOf = (
  registration: Pick<RegistrationDetail, "status" | "event">,
) => {
  if (registration.status === "PENDING_PAYMENT") {
    return "Menunggu pembayaran. Kursi kembali sendiri bila tagihan kedaluwarsa.";
  }
  if (registration.status !== "CONFIRMED") {
    return "Pendaftaran ini sudah tidak aktif.";
  }
  if (registration.event.isPaid) {
    return "Pengembalian dana ditangani di luar sistem.";
  }

  return null;
};

export const isInvoiceMissing = (
  registration: Pick<RegistrationDetail, "status" | "payment">,
) =>
  registration.status === "PENDING_PAYMENT" &&
  registration.payment !== null &&
  !registration.payment.invoiceUrl;

export const isPast = (iso: string | null, now: Date = new Date()) =>
  iso !== null && new Date(iso).getTime() < now.getTime();

export const PARTICIPANT_KIND_LABEL = {
  jemaat: "Jemaat",
  tamu: "Tamu",
} as const;

export type ParticipantKind = keyof typeof PARTICIPANT_KIND_LABEL;

const PHONE = /^[0-9+\-\s]+$/;

const PHONE_ERROR = "Isi nomor telepon, 6–15 digit";

const isPhoneValid = (phone: string) =>
  phone.length >= 6 && phone.length <= 15 && PHONE.test(phone);

export const registrationFormSchema = z
  .object({
    eventId: z.string().min(1, "Pilih event"),
    kind: z.enum(["jemaat", "tamu"]),
    jemaatId: z.string(),
    participantName: z.string(),
    participantPhone: z.string(),
    participantEmail: z.string(),
    isPhoneAsked: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const name = values.participantName.trim();
    const phone = values.participantPhone.trim();
    const email = values.participantEmail.trim();
    const isGuest = values.kind === "tamu";

    const addIssue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (!isGuest && !values.jemaatId) addIssue("jemaatId", "Pilih jemaat");

    if (isGuest && name.length < 3) {
      addIssue("participantName", "Isi nama peserta, minimal 3 karakter");
    }
    if (isGuest && name.length > 150) {
      addIssue("participantName", "Nama peserta maksimal 150 karakter");
    }

    const isPhoneChecked = isGuest || values.isPhoneAsked || phone !== "";

    if (isPhoneChecked && !isPhoneValid(phone)) {
      addIssue("participantPhone", PHONE_ERROR);
    }

    if (email.length > 150) {
      addIssue("participantEmail", "Email maksimal 150 karakter");
    } else if (email && !z.email().safeParse(email).success) {
      addIssue(
        "participantEmail",
        "Isi email dengan format yang benar, mis. nama@contoh.com",
      );
    }
  });

export type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

export const EMPTY_REGISTRATION_FORM: RegistrationFormValues = {
  eventId: "",
  kind: "jemaat",
  jemaatId: "",
  participantName: "",
  participantPhone: "",
  participantEmail: "",
  isPhoneAsked: false,
};

export const isEmailAsked = (kind: ParticipantKind, isPaid: boolean) =>
  kind === "tamu" || isPaid;

export function toRegistrationPayload(
  values: RegistrationFormValues,
  isPaid: boolean,
): RegistrationPayload {
  const phone = values.participantPhone.trim();
  const email = isEmailAsked(values.kind, isPaid)
    ? values.participantEmail.trim()
    : "";

  if (values.kind === "tamu") {
    return {
      eventId: Number(values.eventId),
      jemaatId: null,
      participantName: values.participantName.trim(),
      participantPhone: phone,
      participantEmail: email || null,
    };
  }

  return {
    eventId: Number(values.eventId),
    jemaatId: Number(values.jemaatId),
    ...(phone ? { participantPhone: phone } : {}),
    ...(email ? { participantEmail: email } : {}),
  };
}

const EVENT_ERRORS = new Set([
  "Event Tidak Ditemukan",
  "Event Ini Belum Dipublikasikan",
  "Event Ini Sudah Berlangsung",
  "Event Ini Berbayar Tetapi Belum Memiliki Harga. Lengkapi Data Event Terlebih Dahulu",
]);

const JEMAAT_ERRORS = new Set([
  "Jemaat Tidak Ditemukan",
  "Jemaat ini sudah terdaftar pada event tersebut",
]);

export function serverFieldError(message: string) {
  if (EVENT_ERRORS.has(message)) return { field: "eventId", message };
  if (JEMAAT_ERRORS.has(message)) return { field: "jemaatId", message };

  return null;
}

export const isFullError = (error: unknown) =>
  error instanceof FetchError &&
  error.status === 409 &&
  error.message.startsWith("Kuota");

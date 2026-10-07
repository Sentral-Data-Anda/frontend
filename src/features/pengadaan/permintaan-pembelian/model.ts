import type { ComponentProps } from "react";
import { z } from "zod";

import { optionsOf } from "@/components/common/control";
import type { Badge } from "@/components/common/display";
import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";
import { fromServerAttachment, newAttachments } from "@/lib/attachment";
import { monthRange, toDateInput, todayJakarta } from "@/lib/date";
import { toFormData } from "@/lib/form-data";
import { collapseSpaces } from "@/lib/name";
import { lineAmount } from "@/lib/number";
import type { AttachmentValue } from "@/types/attachment";

import {
  REQUEST_STATUS_LABEL,
  type OrderStatus,
  type PurchaseRequestDetail,
  type RequestStatus,
} from "./types";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

export const REQUEST_LIST_PATH = menuHref(
  MENU.PENGADAAN,
  MENU.PERMINTAAN_PEMBELIAN,
);

export const REQUEST_CREATE_PATH = createHref(
  MENU.PENGADAAN,
  MENU.PERMINTAAN_PEMBELIAN,
);

export const requestHref = (code: string) =>
  detailHref(MENU.PENGADAAN, MENU.PERMINTAAN_PEMBELIAN, code);

export const requestEditHref = (code: string) =>
  editHref(MENU.PENGADAAN, MENU.PERMINTAAN_PEMBELIAN, code);

export const resubmitHref = (code: string) =>
  `${REQUEST_CREATE_PATH}?salin=${encodeURIComponent(code)}`;

export const orderCreateHref = (code: string) =>
  `${createHref(MENU.PENGADAAN, MENU.PESANAN_PEMBELIAN)}?permintaan=${encodeURIComponent(code)}`;

export const orderHref = (code: string) =>
  detailHref(MENU.PENGADAAN, MENU.PESANAN_PEMBELIAN, code);

export const approvalHref = (publicId: string) =>
  detailHref(MENU.PERSETUJUAN, MENU.PERMINTAAN_PERSETUJUAN, publicId);

export const REQUEST_STATUS_VARIANT: Record<RequestStatus, BadgeVariant> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "wait",
  APPROVED: "success",
  REJECTED: "due",
};

export const ORDER_STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  ISSUED: "wait",
  PARTIALLY_RECEIVED: "draft",
  RECEIVED: "success",
  CANCELLED: "neutral",
};

export const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "DRAFT", label: "Draf" },
  { value: "PENDING_APPROVAL", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
] as const;

export const STATUS_OPTIONS = optionsOf(REQUEST_STATUS_LABEL);

export const MINE = "saya";

export function toRequestApiFilters(filters: Record<string, string>) {
  const { startDate, endDate } = monthRange(filters.bulan ?? "");

  return {
    startDate,
    endDate,
    bapelId: filters.badan ?? "",
    requestedBy: filters.pengaju === MINE ? "me" : "",
  };
}

export const MAX_ITEMS = 50;
export const MAX_ATTACHMENTS = 3;
const PURPOSE_MAX = 250;
const NAME_MAX = 150;

export const requestFormSchema = z
  .object({
    bapelId: z.string(),
    purpose: z.string(),
    neededDate: z.string(),
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.string(),
        estimatedUnitPrice: z.string(),
      }),
    ),
    attachments: z.array(z.custom<AttachmentValue>()),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (!values.bapelId) addIssue(["bapelId"], "Pilih badan pelayanan");

    const purpose = collapseSpaces(values.purpose);
    if (!purpose) addIssue(["purpose"], "Isi keperluan");
    else if (purpose.length > PURPOSE_MAX) {
      addIssue(["purpose"], `Keperluan maksimal ${PURPOSE_MAX} karakter`);
    }

    if (values.neededDate && values.neededDate < todayJakarta()) {
      addIssue(
        ["neededDate"],
        "Tanggal dibutuhkan tidak boleh sebelum hari ini",
      );
    }

    if (values.items.length === 0) {
      addIssue(["items"], "Tambahkan minimal satu barang");
    } else if (values.items.length > MAX_ITEMS) {
      addIssue(["items"], `Maksimal ${MAX_ITEMS} barang per permintaan`);
    }

    values.items.forEach((line, index) => {
      const name = collapseSpaces(line.name);

      if (!name) addIssue(["items", index, "name"], "Isi nama barang");
      else if (name.length > NAME_MAX) {
        addIssue(
          ["items", index, "name"],
          `Nama barang maksimal ${NAME_MAX} karakter`,
        );
      }
      if (!(Number(line.quantity) > 0)) {
        addIssue(["items", index, "quantity"], "Isi jumlah, minimal 1");
      }
      if (!(Number(line.estimatedUnitPrice) > 0)) {
        addIssue(
          ["items", index, "estimatedUnitPrice"],
          "Isi perkiraan harga satuan",
        );
      }
    });

    if (values.attachments.length > MAX_ATTACHMENTS) {
      addIssue(["attachments"], `Lampiran maksimal ${MAX_ATTACHMENTS} berkas`);
    }
  });

export type RequestFormValues = z.infer<typeof requestFormSchema>;

export type RequestLine = RequestFormValues["items"][number];

export const emptyLine = (): RequestLine => ({
  name: "",
  quantity: "",
  estimatedUnitPrice: "",
});

export const emptyRequestForm = (): RequestFormValues => ({
  bapelId: "",
  purpose: "",
  neededDate: "",
  items: [emptyLine()],
  attachments: [],
});

const amountOf = (value: string | number) => String(Number(value));

const linesOf = (detail: PurchaseRequestDetail): RequestLine[] =>
  detail.items.map((item) => ({
    name: item.name,
    quantity: String(item.quantity),
    estimatedUnitPrice: amountOf(item.estimatedUnitPrice),
  }));

export const toRequestForm = (
  detail: PurchaseRequestDetail,
): RequestFormValues => ({
  bapelId: String(detail.bapelId),
  purpose: detail.purpose,
  neededDate: toDateInput(detail.neededDate),
  items: linesOf(detail),
  attachments: detail.attachments.map(fromServerAttachment),
});

export const toCopiedForm = (
  detail: PurchaseRequestDetail,
  today = todayJakarta(),
): RequestFormValues => {
  const neededDate = toDateInput(detail.neededDate);

  return {
    bapelId: String(detail.bapelId),
    purpose: detail.purpose,
    neededDate: neededDate && neededDate >= today ? neededDate : "",
    items: linesOf(detail),
    attachments: [],
  };
};

export const lineTotalOf = (lines: readonly RequestLine[]) =>
  lines.reduce(
    (sum, line) =>
      sum + (lineAmount(line.quantity, line.estimatedUnitPrice) ?? 0),
    0,
  );

export const toRequestFormData = (values: RequestFormValues, isEdit: boolean) =>
  toFormData(
    {
      bapelId: values.bapelId,
      purpose: collapseSpaces(values.purpose),
      neededDate: values.neededDate,
      items: JSON.stringify(
        values.items.map((line) => ({
          name: collapseSpaces(line.name),
          quantity: Number(line.quantity),
          estimatedUnitPrice: Number(line.estimatedUnitPrice),
        })),
      ),
      keepFiles: isEdit
        ? JSON.stringify(
            values.attachments
              .filter((item) => item.file === null)
              .map((item) => ({ publicId: item.key })),
          )
        : null,
    },
    newAttachments(values.attachments).map((item) => ({
      field: "image",
      file: item.file,
    })),
  );

const ATTACHMENT_PATHS = new Set(["image", "keepFiles"]);

// be-sada melaporkan lampiran lewat `image`/`keepFiles`; form hanya punya `attachments`.
export const toFormError = (error: unknown) =>
  error instanceof FetchError
    ? new FetchError(
        error.status,
        error.message,
        error.issues.map((issue) => ({
          ...issue,
          path: ATTACHMENT_PATHS.has(issue.path) ? "attachments" : issue.path,
        })),
        error.code,
      )
    : error;

const SERVER_FIELD_ERROR: ReadonlyArray<[RegExp, string, string?]> = [
  [/unsupported file type/i, "attachments", "Pilih berkas JPG, PNG, atau PDF"],
  [/file too large/i, "attachments", "Ukuran berkas maksimal 10 MB"],
  [
    /unexpected field|too many files/i,
    "attachments",
    "Lampiran maksimal 3 berkas",
  ],
];

export function serverFieldError(
  message: string,
): { field: string; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message: override ?? message };
  }

  return null;
}

export const isRequestFinished = (message: string) =>
  /sudah selesai/i.test(message);

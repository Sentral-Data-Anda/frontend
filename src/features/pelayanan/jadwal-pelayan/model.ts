import { z } from "zod";

import type { SelectOption } from "@/components/common/control";
import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import {
  monthOptions as libMonthOptions,
  toDateInput,
  todayJakarta,
} from "@/lib/date";
import { formatDate, formatDateShort, formatWeekday } from "@/lib/format";
import { normalizeName } from "@/lib/name";

import type {
  IbadahLink,
  JadwalPelayan,
  JadwalPelayanDetail,
  JadwalPelayanPayload,
  PelayanOption,
  SlotPayload,
  SlotPelayan,
  TemplateOption,
} from "./types";

export const JADWAL_PELAYAN_LIST_PATH = menuHref(
  MENU.PELAYANAN,
  MENU.JADWAL_PELAYAN,
);

export const JADWAL_PELAYAN_CREATE_PATH = createHref(
  MENU.PELAYANAN,
  MENU.JADWAL_PELAYAN,
);

export const jadwalDetailHref = (code: string) =>
  detailHref(MENU.PELAYANAN, MENU.JADWAL_PELAYAN, code);

export const jadwalEditHref = (code: string) =>
  editHref(MENU.PELAYANAN, MENU.JADWAL_PELAYAN, code);

export const salinHref = (code: string) =>
  `${JADWAL_PELAYAN_CREATE_PATH}?salin=${encodeURIComponent(code)}`;

export const formatTimeRange = (start: string, end: string) =>
  `${start}–${end}`;

export const formatScheduleDate = (date: string) =>
  `${formatWeekday(date)}, ${formatDateShort(date)}`;

const shortWeekdayFormat = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  timeZone: "UTC",
});

export const formatTableDate = (date: string) =>
  `${shortWeekdayFormat.format(new Date(date))}, ${formatDateShort(date)}`;

export const ibadahLabel = (ibadah: IbadahLink) =>
  `${ibadah.typeIbadah.name} · ${ibadah.startTime}`;

export const emptySlotCount = (row: Pick<JadwalPelayan, "detail">) =>
  row.detail.filter((slot) => !slot.pelayan).length;

// Jadwal disusun di muka, jadi rentangnya bukan 13 bawaan lib: 3 bulan ke depan.
export const monthOptions = (today: string = todayJakarta()): SelectOption[] =>
  libMonthOptions(today, { count: 15, ahead: 3 });

const EMPTY_SLOT: SlotPayload = {
  pelayanId: null,
  musikSkillId: null,
  groupPelayanId: null,
};

export function toSlotPayload(value: string): SlotPayload {
  const [id, kind] = value.split("-");

  if (!id || !kind) return EMPTY_SLOT;
  if (kind === "G") return { ...EMPTY_SLOT, groupPelayanId: Number(id) };

  return {
    ...EMPTY_SLOT,
    pelayanId: Number(id),
    musikSkillId: kind === "I" ? null : Number(kind),
  };
}

export const pelayanIdOf = (value: string) => toSlotPayload(value).pelayanId;

const groupIdOf = (value: string) => toSlotPayload(value).groupPelayanId;

const slotSchema = z.object({
  roleId: z.string().min(1, "Pilih tugas."),
  pelayan: z.string(),
});

export type SlotRow = z.infer<typeof slotSchema>;

export const EMPTY_SLOT_ROW: SlotRow = { roleId: "", pelayan: "" };

const fields = z.object({
  bapelId: z.string().min(1, "Pilih badan pelayanan."),
  date: z.string().min(1, "Tanggal wajib diisi"),
  startTime: z.string().min(1, "Isi jam mulai."),
  endTime: z.string().min(1, "Isi jam selesai."),
  name: z.string(),
  makeTemplate: z.enum(["false", "true"]),
  slots: z.array(slotSchema).min(1, "Tambahkan minimal satu petugas."),
});

const duplicateMessage = (slot: SlotRow) =>
  groupIdOf(slot.pelayan)
    ? "Kelompok ini sudah mengisi tugas lain di jadwal ini."
    : "Orang ini sudah mengisi tugas lain di jadwal ini.";

const personKeyOf = (value: string) => {
  const slot = toSlotPayload(value);

  if (slot.groupPelayanId) return `G${slot.groupPelayanId}`;

  return slot.pelayanId ? `P${slot.pelayanId}` : "";
};

export const jadwalFormSchema = fields.superRefine((values, context) => {
  const name = normalizeName(values.name);

  if (
    values.startTime &&
    values.endTime &&
    values.endTime <= values.startTime
  ) {
    context.addIssue({
      code: "custom",
      path: ["endTime"],
      message: "Jam selesai harus sesudah jam mulai.",
    });
  }

  if (!name) {
    context.addIssue({
      code: "custom",
      path: ["name"],
      message: "Isi nama jadwal, mis. Pelayan Ibadah Minggu I.",
    });
  } else if (name.length < 4 || name.length > 50) {
    context.addIssue({
      code: "custom",
      path: ["name"],
      message:
        name.length < 4
          ? "Nama jadwal minimal 4 karakter."
          : "Nama jadwal maksimal 50 karakter.",
    });
  }

  const seen = new Set<string>();

  values.slots.forEach((slot, index) => {
    const key = personKeyOf(slot.pelayan);

    if (!key) return;
    if (seen.has(key)) {
      context.addIssue({
        code: "custom",
        path: ["slots", index, "pelayan"],
        message: duplicateMessage(slot),
      });
    }
    seen.add(key);
  });
});

export type JadwalFormValues = z.infer<typeof jadwalFormSchema>;

export const EMPTY_JADWAL_FORM: JadwalFormValues = {
  bapelId: "",
  date: "",
  startTime: "",
  endTime: "",
  name: "",
  makeTemplate: "false",
  slots: [EMPTY_SLOT_ROW],
};

export const filledCount = (slots: readonly SlotRow[]) =>
  slots.filter((slot) => slot.pelayan).length;

export const toJadwalPayload = (
  values: JadwalFormValues,
  isEdit: boolean,
): JadwalPelayanPayload => ({
  bapelId: Number(values.bapelId),
  date: values.date,
  name: normalizeName(values.name),
  startTime: values.startTime,
  endTime: values.endTime,
  makeTemplate: !isEdit && values.makeTemplate === "true",
  detail: values.slots.map((slot, index) => ({
    order: index + 1,
    rolePelayanId: Number(slot.roleId),
    ...toSlotPayload(slot.pelayan),
  })),
});

const byOrder = <T extends { order: number }>(slots: readonly T[]) =>
  [...slots].sort((a, b) => a.order - b.order);

export const toJadwalForm = (
  detail: JadwalPelayanDetail,
): JadwalFormValues => ({
  bapelId: String(detail.bapel.id),
  date: toDateInput(detail.date),
  startTime: detail.startTime,
  endTime: detail.endTime,
  name: detail.name,
  makeTemplate: "false",
  slots: byOrder(detail.detail).map((slot) => ({
    roleId: slot.rolePelayanId,
    pelayan: slot.pelayanId,
  })),
});

export function toJadwalCopy(source: JadwalPelayanDetail): {
  values: JadwalFormValues;
  skipped: number;
} {
  const slots = byOrder(source.detail);

  return {
    values: {
      ...toJadwalForm(source),
      date: "",
      slots: slots.map((slot) => ({
        roleId: slot.rolePelayanId,
        pelayan: slot.pelayan?.isActive === false ? "" : slot.pelayanId,
      })),
    },
    skipped: slots.filter((slot) => slot.pelayan?.isActive === false).length,
  };
}

export const withTemplate = (
  values: JadwalFormValues,
  template: TemplateOption,
): JadwalFormValues => ({
  ...values,
  startTime: template.startTime,
  endTime: template.endTime,
  name: values.name.trim() ? values.name : template.name,
  slots: byOrder(template.detail).map((slot) => ({
    roleId: String(slot.rolePelayanId),
    pelayan: "",
  })),
});

export const savedPelayanOf = (detail: JadwalPelayanDetail | undefined) =>
  new Map(
    (detail?.detail ?? [])
      .filter((slot) => slot.pelayan)
      .map((slot) => [slot.pelayanId, slot.pelayan as SlotPelayan]),
  );

export const UNASSIGNED_OPTION: SelectOption = {
  value: "",
  label: "Belum diisi",
};

export const takenKeysOf = (slots: readonly SlotRow[], exceptIndex: number) =>
  new Map(
    slots
      .map((slot, index) => [personKeyOf(slot.pelayan), index + 1] as const)
      .filter(([key], index) => key && index !== exceptIndex),
  );

const hintOf = (row: PelayanOption, takenRow: number | undefined) => {
  if (takenRow) return `Sudah di petugas ${takenRow}`;
  if (row.disableServe) {
    return row.unavailableReason ?? "Tidak tersedia pada jam ini";
  }

  return row.typePelayan === "GROUP" ? "Kelompok" : undefined;
};

export function toPelayanOptions(
  rows: readonly PelayanOption[],
  takenKeys: ReadonlyMap<string, number>,
): SelectOption[] {
  return [...rows]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((row) => {
      const takenRow = takenKeys.get(personKeyOf(row.code));

      return {
        value: row.code,
        label: row.name,
        hint: hintOf(row, takenRow),
        isDisabled: row.disableServe || Boolean(takenRow) || undefined,
      };
    });
}

export const savedLabelOf = (saved: SlotPelayan) =>
  saved.isActive ? saved.name : `${saved.name} (nonaktif)`;

export function withSavedPelayan(
  options: readonly SelectOption[],
  value: string,
  saved: SlotPelayan | undefined,
): SelectOption[] {
  const isListed = options.some((option) => option.value === value);

  if (!value || !saved || (isListed && saved.isActive)) {
    return [UNASSIGNED_OPTION, ...options];
  }

  return [
    UNASSIGNED_OPTION,
    {
      value,
      label: savedLabelOf(saved),
      hint: saved.isGroup ? "Kelompok" : undefined,
    },
    ...options.filter((option) => option.value !== value),
  ];
}

export type WhatsAppInput = {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  bapelName: string;
  ibadah: readonly IbadahLink[];
  slots: readonly { role: string; pelayan: string | null }[];
};

export function toWhatsAppText(input: WhatsAppInput): string {
  const header = [
    `*${input.name}*`,
    `${formatWeekday(input.date)}, ${formatDate(input.date)} · ${formatTimeRange(input.startTime, input.endTime)}`,
    input.bapelName,
    input.ibadah.length
      ? `Ibadah: ${input.ibadah.map((ibadah) => `${ibadah.typeIbadah.name} ${ibadah.startTime}`).join(", ")}`
      : null,
  ].filter(Boolean);
  const slots = input.slots.map(
    (slot, index) =>
      `${index + 1}. ${slot.role}: ${slot.pelayan || "(belum diisi)"}`,
  );

  return [...header, "", ...slots].join("\n");
}

export const detailToWhatsApp = (
  detail: JadwalPelayanDetail,
): WhatsAppInput => ({
  name: detail.name,
  date: detail.date,
  startTime: detail.startTime,
  endTime: detail.endTime,
  bapelName: detail.bapel.name,
  ibadah: detail.ibadah,
  slots: byOrder(detail.detail).map((slot) => ({
    role: slot.role.name,
    pelayan: slot.pelayan?.name ?? null,
  })),
});

export type FormFieldError = { field: string; message: string };

const TEMPLATE_TAKEN =
  "Sudah ada template bernama ini. Ganti nama jadwal atau pilih Tidak pada Simpan juga sebagai template.";

const FORM_FIELDS = new Set([
  "bapelId",
  "date",
  "startTime",
  "endTime",
  "name",
]);

const SLOT_PATH = /^detail\.(\d+)\.(\w+)$/;

const fieldOfPath = (path: string) => {
  const slot = SLOT_PATH.exec(path);

  if (slot) {
    return `slots.${slot[1]}.${slot[2] === "rolePelayanId" ? "roleId" : "pelayan"}`;
  }
  if (path === "detail") return "slots";

  return FORM_FIELDS.has(path) ? path : "root";
};

const messageOf = (message: string) => {
  if (/^nama template sudah tersedia/i.test(message)) return TEMPLATE_TAKEN;
  if (/^bapel tidak ditemukan/i.test(message)) {
    return "Badan pelayanan ini sudah dihapus. Pilih yang lain.";
  }
  if (/^role pelayan \d+ tidak ditemukan/i.test(message)) {
    return "Tugas ini sudah dihapus. Muat ulang halaman lalu pilih tugas lain.";
  }
  if (
    /^(group pelayan|pelayan|skill musik) \d+ tidak ditemukan/i.test(message)
  ) {
    return "Pelayan ini sudah dihapus. Muat ulang halaman lalu pilih lagi.";
  }

  return message;
};

const bareNameOf = (label: string) => label.replace(/ \([^)]*\)$/, "");

export function slotIndexOf(
  message: string,
  labels: readonly string[],
): number | null {
  const member = /^.+? \(Anggota (.+?)\) /.exec(message)?.[1];

  if (member) {
    const index = labels.indexOf(member);

    return index < 0 ? null : index;
  }

  const matches = labels
    .map((label, index) => ({
      index,
      name: [label, bareNameOf(label)].find(
        (candidate) => candidate && message.startsWith(`${candidate} `),
      ),
    }))
    .filter((match) => match.name)
    .sort((a, b) => (b.name?.length ?? 0) - (a.name?.length ?? 0));

  return matches[0]?.index ?? null;
}

export function toFormErrors(
  failure: {
    message: string;
    issues: readonly { path: string; message: string }[];
  },
  slotLabels: readonly string[],
): FormFieldError[] {
  if (failure.issues.length) {
    return failure.issues.map((issue) => ({
      field: fieldOfPath(issue.path),
      message: messageOf(issue.message),
    }));
  }

  const message = messageOf(failure.message);

  if (message === TEMPLATE_TAKEN) return [{ field: "name", message }];
  if (/^badan pelayanan ini sudah dihapus/i.test(message)) {
    return [{ field: "bapelId", message }];
  }
  if (/^jadwal pelayan tidak lagi sesuai/i.test(message)) {
    return [{ field: "date", message }];
  }

  const index = slotIndexOf(message, slotLabels);

  return [
    { field: index === null ? "root" : `slots.${index}.pelayan`, message },
  ];
}

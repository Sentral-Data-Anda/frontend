import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";
import { formatDateShort } from "@/lib/format";
import { normalizeName } from "@/lib/name";

import type {
  FutureSlot,
  PelayanDetail,
  PelayanListItem,
  PelayanPayload,
} from "./types";

export const DAFTAR_PELAYAN_LIST_PATH = menuHref(
  MENU.PELAYANAN,
  MENU.DAFTAR_PELAYAN,
);

export const IS_ACTIVE_PARAM: Record<string, string> = {
  aktif: "true",
  nonaktif: "false",
};

const memberSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
});

export type MemberValue = z.infer<typeof memberSchema>;

export const pelayanFormSchema = z
  .object({
    typePelayan: z.enum(["INDIVIDUAL", "GROUP"]),
    jemaatId: z.string(),
    name: z.string(),
    phone: z.string(),
    bapelId: z.string(),
    status: z.enum(["true", "false"]),
    rolePelayan: z.array(z.string()),
    musikSkill: z.array(z.string()),
    members: z.array(memberSchema),
  })
  .superRefine((values, ctx) => {
    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    const isGroup = values.typePelayan === "GROUP";
    const name = normalizeName(values.name);

    if (!isGroup && !values.jemaatId) {
      fail("jemaatId", "Pilih jemaat yang melayani.");
    }
    if (isGroup && !name) {
      fail("name", "Isi nama kelompok, mis. Paduan Suara Efrata.");
    } else if (isGroup && name.length > 50) {
      fail("name", "Nama kelompok maksimal 50 karakter.");
    }
    if (isGroup && !values.phone) {
      fail("phone", "Isi nomor HP kontak kelompok.");
    } else if (isGroup && !/^\d+$/.test(values.phone)) {
      fail("phone", "Nomor HP hanya angka.");
    } else if (isGroup && values.phone.length > 12) {
      fail("phone", "Nomor HP maksimal 12 angka.");
    }
    if (!values.bapelId) fail("bapelId", "Pilih badan pelayanan.");
    if (values.rolePelayan.length === 0) {
      fail("rolePelayan", "Pilih minimal satu tugas.");
    } else if (isGroup && values.rolePelayan.length > 1) {
      fail("rolePelayan", "Kelompok hanya memegang satu tugas.");
    }
    if (isGroup && values.members.length === 0) {
      fail("members", "Tambahkan minimal satu anggota.");
    }
  });

export type PelayanFormValues = z.infer<typeof pelayanFormSchema>;

export const EMPTY_PELAYAN_FORM: PelayanFormValues = {
  typePelayan: "INDIVIDUAL",
  jemaatId: "",
  name: "",
  phone: "",
  bapelId: "",
  status: "true",
  rolePelayan: [],
  musikSkill: [],
  members: [],
};

export const toDigits = (value: string) =>
  value.replace(/\D/g, "").slice(0, 12);

export const toPelayanPayload = (values: PelayanFormValues): PelayanPayload => {
  const isGroup = values.typePelayan === "GROUP";
  const musikSkill = values.musikSkill.map(Number);

  return {
    typePelayan: values.typePelayan,
    bapelId: Number(values.bapelId),
    jemaatId: isGroup ? null : Number(values.jemaatId),
    name: isGroup ? normalizeName(values.name) : null,
    phone: isGroup ? values.phone : null,
    members: isGroup ? values.members.map((member) => Number(member.id)) : [],
    rolePelayan: values.rolePelayan.map(Number),
    isPemusik: musikSkill.length > 0,
    musikSkill,
    status: values.status === "true",
  };
};

export const toPelayanForm = (detail: PelayanDetail): PelayanFormValues => ({
  typePelayan: detail.typePelayan,
  jemaatId: detail.jemaatId ?? "",
  name: detail.name ?? "",
  phone: detail.phone ?? "",
  bapelId: detail.bapelId,
  status: detail.status ? "true" : "false",
  rolePelayan: detail.rolePelayan,
  musikSkill: detail.musikSkill,
  members: detail.memberList.map((member) => ({
    id: String(member.id),
    code: member.code,
    name: member.name,
  })),
});

export const nameOfDetail = (detail: PelayanDetail | undefined) =>
  detail?.jemaat?.name ?? detail?.name ?? "";

export const tugasOf = (item: Pick<PelayanListItem, "role" | "musikSkill">) =>
  [item.role.join(", "), item.musikSkill.join(", ")]
    .filter(Boolean)
    .join(" · ");

type FieldName = keyof PelayanFormValues;

type Rule = {
  pattern: RegExp;
  field: FieldName;
  message: (match: RegExpMatchArray) => string;
};

const bapelText = (name: string) =>
  /^badan pelayanan ini$/i.test(name) ? "badan pelayanan ini" : name;

const RELOAD = "Muat ulang halaman lalu pilih lagi.";

const rulesOf = (isEdit: boolean): Rule[] => [
  {
    pattern: /sudah terdaftar sebagai pelayan di (.+)$/i,
    field: isEdit ? "bapelId" : "jemaatId",
    message: ([, bapel]) =>
      `Jemaat ini sudah terdaftar sebagai pelayan di ${bapelText(bapel)}. Pilih badan pelayanan lain.`,
  },
  {
    pattern: /tidak aktif dan tidak dapat didaftarkan/i,
    field: "jemaatId",
    message: () =>
      "Jemaat ini tidak aktif. Hanya jemaat aktif yang bisa melayani.",
  },
  {
    pattern: /^nama group tersebut sudah tersedia/i,
    field: "name",
    message: () => "Nama kelompok ini sudah dipakai. Pakai nama lain.",
  },
  {
    pattern: /^bapel (tidak ditemukan|tidak tersedia)/i,
    field: "bapelId",
    message: () => "Badan pelayanan ini sudah dihapus. Pilih yang lain.",
  },
  {
    pattern: /^role pelayan dengan id/i,
    field: "rolePelayan",
    message: () => `Salah satu tugas sudah dihapus. ${RELOAD}`,
  },
  {
    pattern: /^skill musik dengan id/i,
    field: "musikSkill",
    message: () => `Salah satu alat musik sudah dihapus. ${RELOAD}`,
  },
  {
    pattern: /^jemaat tidak ditemukan/i,
    field: "jemaatId",
    message: () => "Jemaat ini sudah dihapus. Pilih jemaat lain.",
  },
  {
    pattern: /^anggota group dengan jemaat id/i,
    field: "members",
    message: () =>
      "Salah satu anggota sudah dihapus dari data jemaat. Hapus lalu tambahkan lagi.",
  },
  {
    pattern: /^anggota group (.+) bukan jemaat aktif/i,
    field: "members",
    message: ([, name]) =>
      `${name} bukan jemaat aktif. Hapus dari daftar anggota.`,
  },
];

export function serverFieldError(
  message: string,
  isEdit: boolean,
): { field: FieldName; message: string } | null {
  for (const rule of rulesOf(isEdit)) {
    const match = message.match(rule.pattern);

    if (match) return { field: rule.field, message: rule.message(match) };
  }

  return null;
}

export const withFieldMessages = (error: unknown, isEdit: boolean): unknown =>
  error instanceof FetchError && error.issues.length > 0
    ? new FetchError(
        error.status,
        error.message,
        error.issues.map((issue) => ({
          path: issue.path,
          message:
            serverFieldError(issue.message, isEdit)?.message ?? issue.message,
        })),
        error.code,
      )
    : error;

export const futureSlotsTitle = (name: string, slots: FutureSlot[]) =>
  `${name} masih terjadwal di ${slots.length} jadwal`;

export const futureSlotLines = (slots: FutureSlot[]): string[] => [
  ...slots
    .slice(0, 3)
    .map((slot) => `${formatDateShort(slot.date)} · ${slot.name}`),
  ...(slots.length > 3 ? [`dan ${slots.length - 3} lainnya`] : []),
  "Ganti petugasnya di Jadwal Pelayan.",
];

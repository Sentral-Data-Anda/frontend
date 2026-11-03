import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { emptyToNull } from "@/lib/utils";

import {
  END_REASONS,
  MEMBER_ROLES,
  type EndMembershipPayload,
  type EndReason,
  type Keluarga,
  type KeluargaMemberPayload,
  type KeluargaPayload,
  type MemberRole,
} from "./types";

export const KELUARGA_LIST_PATH = menuHref(MENU.KEJEMAATAN, MENU.KELUARGA);

export const WORSHIPS_HERE_LABEL = { true: "Ya", false: "Tidak" } as const;

const required = (message: string) => z.string().trim().min(1, message);

export const MEMBER_ROLE_LABEL: Record<MemberRole, string> = {
  SUAMI: "Suami",
  ISTRI: "Istri",
  ANAK: "Anak",
};

export const END_REASON_LABEL: Record<EndReason, string> = {
  MENIKAH: "Menikah, membentuk keluarga sendiri",
  MEMISAHKAN_DIRI: "Memisahkan diri, mendaftarkan KK sendiri",
  CERAI_HIDUP: "Cerai hidup",
  LAINNYA: "Lainnya",
};

/** Kept where the child is now. */
export const CHILD_STAYS = "TETAP";

const END_REASON_VALUES = ["", ...END_REASONS] as const;

/**
 * What an ending has to answer depends on who is leaving, so the schema is
 * built per member rather than once: only a head hands the role over, only a
 * divorce closes a partner, and only a couple breaking up splits the children.
 */
export const endMembershipSchemaFor = (context: {
  partnerName: string | null;
  children: readonly { jemaatCode: string; name: string }[];
}) =>
  z
    .object({
      endedAt: required("Tanggal berakhir wajib diisi."),
      endReason: z.enum(END_REASON_VALUES, {
        error: "Pilih alasan berakhir.",
      }),
      endNote: z.string(),

      // "" means unanswered. A boolean would make an unanswered question read
      // as "no", which is the guess this screen exists to avoid.
      newHeadJemaatCode: z.string(),
      alsoEndPartner: z.enum(["", "true", "false"]),
      childPlacements: z.array(
        z.object({ jemaatCode: z.string(), keluargaCode: z.string() }),
      ),
    })
    .superRefine((values, ctx) => {
      const add = (path: (string | number)[], message: string) =>
        ctx.addIssue({ code: "custom", path, message });

      // Empty is a valid enum member only so the placeholder can start there;
      // it is still an unanswered question, not "Lainnya".
      if (!values.endReason) add(["endReason"], "Pilih alasan berakhir.");

      // Kepala pengganti tidak lagi wajib dijawab: backend meneruskan
      // jabatannya sendiri lewat rantai SUAMI → ISTRI → anak tertua. Mengisi
      // field ini menimpa rantai itu, dan membiarkannya kosong adalah jawaban
      // yang benar untuk hampir semua keluarga.

      const isDivorce = values.endReason === "CERAI_HIDUP";

      if (isDivorce && context.partnerName && !values.alsoEndPartner) {
        add(
          ["alsoEndPartner"],
          `Jawab dulu: keanggotaan ${context.partnerName} ikut ditutup atau tidak.`,
        );
      }

      if (!isDivorce || values.alsoEndPartner !== "true") return;

      context.children.forEach((child) => {
        const index = values.childPlacements.findIndex(
          (row) => row.jemaatCode === child.jemaatCode,
        );

        if (index >= 0 && values.childPlacements[index].keluargaCode) return;

        add(
          ["childPlacements", Math.max(index, 0), "keluargaCode"],
          `Tentukan ${child.name} ikut keluarga yang mana.`,
        );
      });
    });

export type EndMembershipValues = z.infer<
  ReturnType<typeof endMembershipSchemaFor>
>;

export const EMPTY_END_MEMBERSHIP: EndMembershipValues = {
  endedAt: "",
  endReason: "",
  endNote: "",
  newHeadJemaatCode: "",
  alsoEndPartner: "",
  childPlacements: [],
};

export function toEndMembershipPayload(
  values: EndMembershipValues,
): EndMembershipPayload {
  const isDivorce = values.endReason === "CERAI_HIDUP";
  const alsoEndPartner = values.alsoEndPartner
    ? values.alsoEndPartner === "true"
    : null;

  return {
    endedAt: values.endedAt,
    // The schema rejects "", so a payload only exists after a reason is picked.
    endReason: values.endReason as EndReason,
    endNote: values.endNote.trim() || null,
    newHeadJemaatCode: values.newHeadJemaatCode || null,
    alsoEndPartner: isDivorce ? alsoEndPartner : null,
    childPlacements:
      isDivorce && alsoEndPartner
        ? values.childPlacements.map((row) => ({
            jemaatCode: row.jemaatCode,
            // "Tetap" is a decision, and it travels as the null be-sada reads
            // as "leave this child where they are".
            keluargaCode:
              row.keluargaCode === CHILD_STAYS ? null : row.keluargaCode,
          }))
        : null,
  };
}

export const memberRowSchema = z.object({
  jemaatCode: required("Pilih jemaat untuk baris ini."),
  roleInFamily: z.enum(MEMBER_ROLES, { error: "Pilih peran anggota." }),
  /**
   * Dikosongkan, backend memilih lewat rantai SUAMI → ISTRI → anak tertua,
   * yang benar untuk hampir semua keluarga. Ditandai, ia menimpa rantai itu —
   * ada kasus ayah masih hidup tapi anaknya yang terdaftar sebagai kepala.
   */
  kepalaKeluarga: z.boolean().optional(),
});

export type MemberRow = z.infer<typeof memberRowSchema>;

export const EMPTY_MEMBER_ROW: MemberRow = {
  jemaatCode: "",
  roleInFamily: "ANAK",
};

/**
 * Data pernikahan, diminta hanya ketika satu KK memuat suami dan istri.
 *
 * Tanggalnya TIDAK wajib di tingkat field: setiap field di form ini hidup
 * sebagai string kosong sampai diisi, dan mewajibkannya di sini akan membuat
 * form keluarga biasa — yang tidak memuat pasangan sama sekali — gagal
 * validasi pada field yang tidak ditampilkan. Kewajibannya dipegang
 * `keluargaFormSchema`, yang bisa melihat susunan anggotanya.
 */
export const marriageSchema = z.object({
  date: z.string(),
  place: z.string().max(100, "Tempat maksimal 100 karakter"),
  certificateNumber: z.string().max(50, "Nomor surat maksimal 50 karakter"),
});

export type MarriageRow = z.infer<typeof marriageSchema>;

export const EMPTY_MARRIAGE: MarriageRow = {
  date: "",
  place: "",
  certificateNumber: "",
};

/** Apakah susunan baris ini memuat suami dan istri sekaligus. */
export const isCouple = (members: readonly { roleInFamily: string }[]) =>
  members.filter((row) => row.roleInFamily === "SUAMI").length === 1 &&
  members.filter((row) => row.roleInFamily === "ISTRI").length === 1;

export const keluargaFormSchema = z
  .object({
    zoneChurchId: z.string(),
    worshipsHere: z.enum(["true", "false"]),
    members: z.array(memberRowSchema),
    // Diminta hanya ketika barisnya memuat suami dan istri sekaligus; di luar
    // itu field-nya tidak ditampilkan dan tidak dikirim.
    marriage: marriageSchema.optional(),
  })
  .superRefine((values, ctx) => {
    for (const role of ["SUAMI", "ISTRI"] as const) {
      if (
        values.members.filter((row) => row.roleInFamily === role).length > 1
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["members"],
          message:
            role === "SUAMI"
              ? "Satu keluarga hanya punya satu suami."
              : "Satu keluarga hanya punya satu istri.",
        });
      }
    }

    if (values.members.filter((row) => row.kepalaKeluarga).length > 1) {
      ctx.addIssue({
        code: "custom",
        path: ["members"],
        message: "Hanya satu anggota yang boleh ditandai kepala keluarga.",
      });
    }

    // Rows still being filled share an empty code; only chosen jemaat can clash.
    const codes = values.members
      .map((row) => row.jemaatCode.trim().toLowerCase())
      .filter(Boolean);

    if (new Set(codes).size !== codes.length) {
      ctx.addIssue({
        code: "custom",
        path: ["members"],
        message: "Satu jemaat hanya boleh dipilih sekali.",
      });
    }

    // Kolomnya NOT NULL dan tidak ada tempat lain yang bisa menanyakannya:
    // fitur Keluarga satu-satunya penulis pernikahan.
    if (isCouple(values.members) && !values.marriage?.date) {
      ctx.addIssue({
        code: "custom",
        path: ["marriage", "date"],
        message: "Mohon lengkapi tanggal pernikahan.",
      });
    }
  });

export type KeluargaFormValues = z.infer<typeof keluargaFormSchema>;

/**
 * Creating a household composes its members, so it must name a head — the
 * family's label is that person's name. Editing does not: the household already
 * has one, and its members are managed from the Keluarga screen, not from this
 * form's rows.
 */
export const keluargaCreateFormSchema = keluargaFormSchema.superRefine(
  (values, ctx) => {
    if (values.members.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["members"],
        message: "Tambahkan minimal satu anggota.",
      });

      return;
    }

    // Siapa kepalanya tidak perlu ditentukan: rantai SUAMI → ISTRI → anak
    // tertua menjawabnya. Kecuali kalau yang ada hanya anak-anak — rumah
    // tangga yatim piatu itu nyata, tapi urutan lahir bukan keputusan yang
    // boleh diambil diam-diam oleh sistem.
    const onlyChildren = values.members.every(
      (row) => row.roleInFamily === "ANAK",
    );

    if (onlyChildren && !values.members.some((row) => row.kepalaKeluarga)) {
      ctx.addIssue({
        code: "custom",
        path: ["members"],
        message: "Tentukan siapa kepala keluarganya.",
      });
    }
  },
);

/**
 * What a household is called: "Kel." plus its head's name. A household without
 * a live head says so instead of showing a blank, because that is a gap the
 * sekretariat has to close, not a cosmetic one.
 */
export const householdLabel = (keluarga: {
  name: string | null;
  code: string;
}) =>
  keluarga.name
    ? `Kel. ${keluarga.name}`
    : `${keluarga.code} (belum ada kepala keluarga)`;

export const EMPTY_KELUARGA_FORM: KeluargaFormValues = {
  zoneChurchId: "",
  worshipsHere: "true",
  members: [],
  marriage: EMPTY_MARRIAGE,
};

export function toKeluargaPayload(values: KeluargaFormValues): KeluargaPayload {
  return {
    zoneChurchId: values.zoneChurchId ? Number(values.zoneChurchId) : null,
    worshipsHere: values.worshipsHere === "true",
    // No start date is asked for here: a clerk filling a household form rarely
    // knows it, and a guessed date reads as fact for ever.
    members: values.members.map((row): KeluargaMemberPayload => ({
      jemaatCode: row.jemaatCode,
      roleInFamily: row.roleInFamily,
      ...(row.kepalaKeluarga ? { kepalaKeluarga: true } : {}),
      startedAt: null,
    })),
    // Dikirim hanya kalau barisnya benar-benar memuat pasangan: backend
    // menolak data pernikahan yang tidak melengkapi siapa pun.
    marriage:
      isCouple(values.members) && values.marriage?.date
        ? {
            date: values.marriage.date,
            place: emptyToNull(values.marriage.place ?? ""),
            certificateNumber: emptyToNull(
              values.marriage.certificateNumber ?? "",
            ),
          }
        : null,
  };
}

export function toKeluargaForm(detail: Keluarga): KeluargaFormValues {
  return {
    zoneChurchId: detail.zoneChurchId?.toString() ?? "",
    worshipsHere: detail.worshipsHere ? "true" : "false",
    // Members already in the household are shown from their own endpoint;
    // this list only carries the rows being added right now.
    members: [],
    marriage: EMPTY_MARRIAGE,
  };
}

export function serverFieldError(
  message: string,
): { field: keyof KeluargaFormValues; message: string } | null {
  return /wilayah gereja tidak ditemukan/i.test(message)
    ? {
        field: "zoneChurchId",
        message: "Wilayah ini sudah tidak ada; pilih ulang dari daftar.",
      }
    : null;
}

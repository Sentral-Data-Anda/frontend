import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";

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
  KEPALA_KELUARGA: "Kepala keluarga",
  PASANGAN: "Pasangan",
  ANAK: "Anak",
};

export const END_REASON_LABEL: Record<EndReason, string> = {
  MENIKAH: "Menikah, membentuk keluarga sendiri",
  MEMISAHKAN_DIRI: "Memisahkan diri, mendaftarkan KK sendiri",
  CERAI_HIDUP: "Cerai hidup",
  MENINGGAL: "Meninggal",
  LAINNYA: "Lainnya",
};

/** Kept where the child is now. */
export const CHILD_STAYS = "TETAP";

/**
 * What an ending has to answer depends on who is leaving, so the schema is
 * built per member rather than once: only a head hands the role over, only a
 * divorce closes a partner, and only a couple breaking up splits the children.
 */
export const endMembershipSchemaFor = (context: {
  requiresSuccessor: boolean;
  partnerName: string | null;
  children: readonly { jemaatCode: string; name: string }[];
}) =>
  z
    .object({
      endedAt: required("Tanggal berakhir wajib diisi."),
      endReason: z.enum(END_REASONS, { error: "Pilih alasan berakhir." }),
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

      if (context.requiresSuccessor && !values.newHeadJemaatCode) {
        add(
          ["newHeadJemaatCode"],
          "Pilih kepala keluarga pengganti. Keluarga selalu terdaftar atas nama seseorang.",
        );
      }

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
  endReason: "MENINGGAL",
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
    endReason: values.endReason,
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
  startedAt: z.string(),
});

export type MemberRow = z.infer<typeof memberRowSchema>;

export const EMPTY_MEMBER_ROW: MemberRow = {
  jemaatCode: "",
  roleInFamily: "ANAK",
  startedAt: "",
};

export const keluargaFormSchema = z
  .object({
    zoneChurchId: z.string(),
    worshipsHere: z.enum(["true", "false"]),
    members: z.array(memberRowSchema),
  })
  .superRefine((values, ctx) => {
    for (const role of ["KEPALA_KELUARGA", "PASANGAN"] as const) {
      if (
        values.members.filter((row) => row.roleInFamily === role).length > 1
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["members"],
          message:
            role === "KEPALA_KELUARGA"
              ? "Satu keluarga hanya punya satu kepala keluarga."
              : "Satu keluarga hanya punya satu pasangan.",
        });
      }
    }

    const codes = values.members.map((row) => row.jemaatCode.toLowerCase());

    if (new Set(codes).size !== codes.length) {
      ctx.addIssue({
        code: "custom",
        path: ["members"],
        message: "Satu jemaat hanya boleh dipilih sekali.",
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
    const heads = values.members.filter(
      (row) => row.roleInFamily === "KEPALA_KELUARGA",
    );

    if (heads.length !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["members"],
        message: "Tentukan tepat satu kepala keluarga.",
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
};

export function toKeluargaPayload(values: KeluargaFormValues): KeluargaPayload {
  return {
    zoneChurchId: values.zoneChurchId ? Number(values.zoneChurchId) : null,
    worshipsHere: values.worshipsHere === "true",
    members: values.members.map((row): KeluargaMemberPayload => ({
      jemaatCode: row.jemaatCode,
      roleInFamily: row.roleInFamily,
      startedAt: row.startedAt || null,
    })),
  };
}

export function toKeluargaForm(detail: Keluarga): KeluargaFormValues {
  return {
    zoneChurchId: detail.zoneChurchId?.toString() ?? "",
    worshipsHere: detail.worshipsHere ? "true" : "false",
    // Members already in the household are shown from their own endpoint;
    // this list only carries the rows being added right now.
    members: [],
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

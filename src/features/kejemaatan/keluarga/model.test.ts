import { describe, expect, test } from "bun:test";

import {
  EMPTY_KELUARGA_FORM,
  keluargaCreateFormSchema,
  EMPTY_END_MEMBERSHIP,
  endMembershipSchemaFor,
  keluargaFormSchema,
  toEndMembershipPayload,
  type EndMembershipValues,
  serverFieldError,
  toKeluargaForm,
  toKeluargaPayload,
  type KeluargaFormValues,
} from "./model";
import type { Keluarga } from "./types";

const VALID: KeluargaFormValues = {
  ...EMPTY_KELUARGA_FORM,
  members: [
    {
      jemaatCode: "JMT-0001",
      roleInFamily: "KEPALA_KELUARGA",
      startedAt: "",
    },
  ],
};

const issuesOf = (values: KeluargaFormValues) => {
  const parsed = keluargaFormSchema.safeParse(values);

  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => issue.path.join("."));
};

describe("keluargaFormSchema", () => {
  test("isian lengkap tanpa wilayah lolos", () => {
    expect(issuesOf(VALID)).toEqual([]);
  });

  test("form kosong lolos: wilayah dan anggota tidak wajib", () => {
    expect(issuesOf(EMPTY_KELUARGA_FORM)).toEqual([]);
  });

  test("tidak ada isian nama: keluarga dinamai dari kepala keluarga", () => {
    expect(Object.keys(EMPTY_KELUARGA_FORM)).not.toContain("name");
  });

  test("tidak ada isian alamat: alamat keluarga ikut kepala keluarga", () => {
    for (const field of [
      "address",
      "provincesCode",
      "regenciesCode",
      "districtsCode",
      "villagesCode",
    ]) {
      expect(Object.keys(EMPTY_KELUARGA_FORM)).not.toContain(field);
    }
  });
});

describe("toKeluargaPayload", () => {
  test("wilayah kosong dikirim null, beribadah di sini selalu dikirim", () => {
    expect(toKeluargaPayload(VALID)).toEqual({
      zoneChurchId: null,
      worshipsHere: true,
      members: [
        {
          jemaatCode: "JMT-0001",
          roleInFamily: "KEPALA_KELUARGA",
          startedAt: null,
        },
      ],
    });
  });

  test("wilayah jadi angka, Tidak jadi false", () => {
    const payload = toKeluargaPayload({
      ...VALID,
      zoneChurchId: "3",
      worshipsHere: "false",
    });

    expect(payload.zoneChurchId).toBe(3);
    expect(payload.worshipsHere).toBe(false);
  });
});

describe("toKeluargaForm", () => {
  const DETAIL: Keluarga = {
    id: 7,
    publicId: "10000000-0000-4000-8000-000000000007",
    code: "KK-0007",
    zoneChurchId: null,
    worshipsHere: false,
    zoneChurch: null,
    name: "Halim",
    _count: { members: 2 },
  };

  test("null jadi string kosong, boolean jadi pilihan Ya/Tidak", () => {
    const values = toKeluargaForm(DETAIL);

    expect(values.zoneChurchId).toBe("");
    expect(values.worshipsHere).toBe("false");
    expect(toKeluargaPayload(values)).toEqual({
      zoneChurchId: null,
      worshipsHere: false,
      members: [],
    });
  });
});

describe("serverFieldError", () => {
  test("wilayah yang sudah dihapus mendarat di field wilayah", () => {
    expect(serverFieldError("Wilayah Gereja Tidak Ditemukan")?.field).toBe(
      "zoneChurchId",
    );
  });

  test("pesan lain tetap galat form", () => {
    expect(serverFieldError("Kesalahan server.")).toBeNull();
  });
});

describe("anggota keluarga", () => {
  const withMembers = (members: unknown[]) =>
    keluargaFormSchema.safeParse({ ...VALID, members });

  const onCreating = (members: unknown[]) =>
    keluargaCreateFormSchema.safeParse({ ...VALID, members });

  test("baris anggota ikut terkirim bersama keluarganya", () => {
    const payload = toKeluargaPayload({
      ...VALID,
      members: [
        {
          jemaatCode: "JMT-0001",
          roleInFamily: "KEPALA_KELUARGA",
          startedAt: "2019-06-01",
        },
      ],
    });

    expect(payload.members).toEqual([
      {
        jemaatCode: "JMT-0001",
        roleInFamily: "KEPALA_KELUARGA",
        startedAt: "2019-06-01",
      },
    ]);
  });

  test("tanggal mulai yang dikosongkan dikirim null, bukan teks kosong", () => {
    const payload = toKeluargaPayload({
      ...VALID,
      members: [
        { jemaatCode: "JMT-0001", roleInFamily: "ANAK", startedAt: "" },
      ],
    });

    expect(payload.members[0]?.startedAt).toBeNull();
  });

  test("anggota tanpa jemaat ditolak", () => {
    const parsed = withMembers([
      { jemaatCode: "", roleInFamily: "ANAK", startedAt: "" },
    ]);

    expect(parsed.success).toBe(false);
  });

  test("dua kepala keluarga ditolak", () => {
    const parsed = withMembers([
      {
        jemaatCode: "JMT-0001",
        roleInFamily: "KEPALA_KELUARGA",
        startedAt: "",
      },
      {
        jemaatCode: "JMT-0002",
        roleInFamily: "KEPALA_KELUARGA",
        startedAt: "",
      },
    ]);

    expect(parsed.error?.issues[0]?.message).toBe(
      "Satu keluarga hanya punya satu kepala keluarga.",
    );
  });

  test("dua pasangan ditolak", () => {
    const parsed = withMembers([
      { jemaatCode: "JMT-0001", roleInFamily: "PASANGAN", startedAt: "" },
      { jemaatCode: "JMT-0002", roleInFamily: "PASANGAN", startedAt: "" },
    ]);

    expect(parsed.error?.issues[0]?.message).toBe(
      "Satu keluarga hanya punya satu pasangan.",
    );
  });

  test("jemaat yang sama dua kali ditolak", () => {
    const parsed = withMembers([
      {
        jemaatCode: "JMT-0001",
        roleInFamily: "KEPALA_KELUARGA",
        startedAt: "",
      },
      { jemaatCode: "jmt-0001", roleInFamily: "ANAK", startedAt: "" },
    ]);

    expect(parsed.error?.issues[0]?.message).toBe(
      "Satu jemaat hanya boleh dipilih sekali.",
    );
  });

  test("keluarga tanpa kepala keluarga ditolak saat dibuat", () => {
    const parsed = onCreating([
      { jemaatCode: "JMT-0001", roleInFamily: "ANAK", startedAt: "" },
    ]);

    expect(parsed.error?.issues[0]?.message).toBe(
      "Tentukan tepat satu kepala keluarga.",
    );
  });

  test("keluarga dengan kepala keluarga diterima", () => {
    expect(
      withMembers([
        {
          jemaatCode: "JMT-0001",
          roleInFamily: "KEPALA_KELUARGA",
          startedAt: "",
        },
        { jemaatCode: "JMT-0002", roleInFamily: "ANAK", startedAt: "" },
      ]).success,
    ).toBe(true);
  });

  test("banyak anak diperbolehkan", () => {
    expect(
      withMembers([
        {
          jemaatCode: "JMT-0001",
          roleInFamily: "KEPALA_KELUARGA",
          startedAt: "",
        },
        { jemaatCode: "JMT-0002", roleInFamily: "ANAK", startedAt: "" },
        { jemaatCode: "JMT-0003", roleInFamily: "ANAK", startedAt: "" },
      ]).success,
    ).toBe(true);
  });
});

describe("endMembershipSchemaFor", () => {
  const CONTEXT = {
    requiresSuccessor: false,
    partnerName: null as string | null,
    children: [] as { jemaatCode: string; name: string }[],
  };

  const parse = (values: Partial<EndMembershipValues>, context = {}) =>
    endMembershipSchemaFor({ ...CONTEXT, ...context }).safeParse({
      ...EMPTY_END_MEMBERSHIP,
      endedAt: "2026-03-01",
      ...values,
    });

  const messages = (values: Partial<EndMembershipValues>, context = {}) =>
    parse(values, context).error?.issues.map((issue) => issue.message) ?? [];

  test("tanggal berakhir wajib diisi", () => {
    expect(messages({ endedAt: "" })).toContain(
      "Tanggal berakhir wajib diisi.",
    );
  });

  test("tanpa syarat tambahan, isian dasar sudah cukup", () => {
    expect(parse({}).success).toBe(true);
  });

  describe("kepala keluarga pengganti", () => {
    test("wajib saat kepala keluar dan masih ada yang tinggal", () => {
      expect(messages({}, { requiresSuccessor: true })[0]).toContain(
        "Pilih kepala keluarga pengganti",
      );
    });

    test("terjawab sudah cukup", () => {
      expect(
        parse({ newHeadJemaatCode: "JMT-02" }, { requiresSuccessor: true })
          .success,
      ).toBe(true);
    });
  });

  describe("cerai hidup menutup pasangan", () => {
    test("pertanyaan pasangan wajib dijawab, dan menyebut namanya", () => {
      expect(
        messages({ endReason: "CERAI_HIDUP" }, { partnerName: "Rina" })[0],
      ).toBe("Jawab dulu: keanggotaan Rina ikut ditutup atau tidak.");
    });

    test("menjawab tidak sudah cukup", () => {
      expect(
        parse(
          { endReason: "CERAI_HIDUP", alsoEndPartner: "false" },
          { partnerName: "Rina" },
        ).success,
      ).toBe(true);
    });

    test("alasan lain tidak menanyakan pasangan", () => {
      expect(
        parse({ endReason: "MENINGGAL" }, { partnerName: "Rina" }).success,
      ).toBe(true);
    });
  });

  describe("pembagian anak", () => {
    const CHILDREN = [
      { jemaatCode: "JMT-03", name: "Dani" },
      { jemaatCode: "JMT-04", name: "Sari" },
    ];

    test("setiap anak wajib ditentukan, dan yang kurang disebut namanya", () => {
      const issues = messages(
        {
          endReason: "CERAI_HIDUP",
          alsoEndPartner: "true",
          childPlacements: [
            { jemaatCode: "JMT-03", keluargaCode: "TETAP" },
            { jemaatCode: "JMT-04", keluargaCode: "" },
          ],
        },
        { partnerName: "Rina", children: CHILDREN },
      );

      expect(issues).toEqual(["Tentukan Sari ikut keluarga yang mana."]);
    });

    test("semua anak terisi: lolos", () => {
      expect(
        parse(
          {
            endReason: "CERAI_HIDUP",
            alsoEndPartner: "true",
            childPlacements: [
              { jemaatCode: "JMT-03", keluargaCode: "TETAP" },
              { jemaatCode: "JMT-04", keluargaCode: "KK-0009" },
            ],
          },
          { partnerName: "Rina", children: CHILDREN },
        ).success,
      ).toBe(true);
    });

    test("pasangan tidak ikut ditutup: anak tidak ditanyakan", () => {
      expect(
        parse(
          { endReason: "CERAI_HIDUP", alsoEndPartner: "false" },
          { partnerName: "Rina", children: CHILDREN },
        ).success,
      ).toBe(true);
    });
  });
});

describe("toEndMembershipPayload", () => {
  const base: EndMembershipValues = {
    ...EMPTY_END_MEMBERSHIP,
    endedAt: "2026-03-01",
  };

  test("catatan kosong dikirim null, bukan string kosong", () => {
    expect(
      toEndMembershipPayload({ ...base, endNote: "   " }).endNote,
    ).toBeNull();
  });

  test("alasan selain cerai tidak mengirim jawaban pasangan", () => {
    const payload = toEndMembershipPayload({
      ...base,
      endReason: "MENINGGAL",
      alsoEndPartner: "true",
    });

    expect(payload.alsoEndPartner).toBeNull();
    expect(payload.childPlacements).toBeNull();
  });

  test("Tetap dikirim sebagai null, bukan sebagai kode keluarga", () => {
    const payload = toEndMembershipPayload({
      ...base,
      endReason: "CERAI_HIDUP",
      alsoEndPartner: "true",
      childPlacements: [
        { jemaatCode: "JMT-03", keluargaCode: "TETAP" },
        { jemaatCode: "JMT-04", keluargaCode: "KK-0009" },
      ],
    });

    expect(payload.childPlacements).toEqual([
      { jemaatCode: "JMT-03", keluargaCode: null },
      { jemaatCode: "JMT-04", keluargaCode: "KK-0009" },
    ]);
  });

  test("pertanyaan pasangan yang belum dijawab tidak jadi tidak", () => {
    expect(
      toEndMembershipPayload({ ...base, endReason: "CERAI_HIDUP" })
        .alsoEndPartner,
    ).toBeNull();
  });
});

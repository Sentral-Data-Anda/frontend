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
      roleInFamily: "SUAMI",
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
          roleInFamily: "SUAMI",
          startedAt: null,
        },
      ],
      // Tidak ada pasangan di baris ini, jadi tidak ada pernikahan untuk
      // dicatat — dan backend menolaknya kalau tetap dikirim.
      marriage: null,
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
      marriage: null,
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
          roleInFamily: "SUAMI",
        },
      ],
    });

    expect(payload.members).toEqual([
      {
        jemaatCode: "JMT-0001",
        roleInFamily: "SUAMI",
        startedAt: null,
      },
    ]);
  });

  test("form tidak menanyakan tanggal mulai: selalu dikirim null", () => {
    const payload = toKeluargaPayload({
      ...VALID,
      members: [{ jemaatCode: "JMT-0001", roleInFamily: "ANAK" }],
    });

    expect(payload.members[0]?.startedAt).toBeNull();
  });

  test("anggota tanpa jemaat ditolak", () => {
    const parsed = withMembers([{ jemaatCode: "", roleInFamily: "ANAK" }]);

    expect(parsed.success).toBe(false);
  });

  test("dua suami ditolak", () => {
    const parsed = withMembers([
      {
        jemaatCode: "JMT-0001",
        roleInFamily: "SUAMI",
      },
      {
        jemaatCode: "JMT-0002",
        roleInFamily: "SUAMI",
      },
    ]);

    expect(parsed.error?.issues[0]?.message).toBe(
      "Satu keluarga hanya punya satu suami.",
    );
  });

  test("dua istri ditolak", () => {
    const parsed = withMembers([
      { jemaatCode: "JMT-0001", roleInFamily: "ISTRI" },
      { jemaatCode: "JMT-0002", roleInFamily: "ISTRI" },
    ]);

    expect(parsed.error?.issues[0]?.message).toBe(
      "Satu keluarga hanya punya satu istri.",
    );
  });

  test("jemaat yang sama dua kali ditolak", () => {
    const parsed = withMembers([
      {
        jemaatCode: "JMT-0001",
        roleInFamily: "SUAMI",
      },
      { jemaatCode: "jmt-0001", roleInFamily: "ANAK" },
    ]);

    expect(parsed.error?.issues[0]?.message).toBe(
      "Satu jemaat hanya boleh dipilih sekali.",
    );
  });

  test("dua baris yang masih kosong bukan jemaat kembar", () => {
    const parsed = withMembers([
      { jemaatCode: "", roleInFamily: "ANAK" },
      { jemaatCode: "", roleInFamily: "ANAK" },
    ]);

    const messages = parsed.error?.issues.map((issue) => issue.message) ?? [];

    expect(messages).not.toContain("Satu jemaat hanya boleh dipilih sekali.");
  });

  // Siapa kepalanya tidak lagi ditanyakan: rantai SUAMI → ISTRI → anak tertua
  // menjawabnya, dan form yang harus memutuskannya akan menyalin rantai itu.
  test("keluarga dengan suami saja diterima tanpa menandai kepala", () => {
    expect(
      onCreating([{ jemaatCode: "JMT-0001", roleInFamily: "SUAMI" }]).success,
    ).toBe(true);
  });

  // Rumah tangga yatim piatu itu nyata, tapi urutan lahir bukan keputusan yang
  // boleh diambil diam-diam oleh sistem.
  test("keluarga berisi anak saja harus menunjuk kepalanya", () => {
    const parsed = onCreating([
      { jemaatCode: "JMT-0001", roleInFamily: "ANAK" },
      { jemaatCode: "JMT-0002", roleInFamily: "ANAK" },
    ]);

    expect(parsed.error?.issues[0]?.message).toBe(
      "Tentukan siapa kepala keluarganya.",
    );
  });

  test("anak yang ditandai kepala diterima", () => {
    expect(
      onCreating([
        { jemaatCode: "JMT-0001", roleInFamily: "ANAK", kepalaKeluarga: true },
      ]).success,
    ).toBe(true);
  });

  test("dua anggota ditandai kepala ditolak", () => {
    const parsed = withMembers([
      { jemaatCode: "JMT-0001", roleInFamily: "SUAMI", kepalaKeluarga: true },
      { jemaatCode: "JMT-0002", roleInFamily: "ANAK", kepalaKeluarga: true },
    ]);

    expect(parsed.error?.issues[0]?.message).toBe(
      "Hanya satu anggota yang boleh ditandai kepala keluarga.",
    );
  });

  test("keluarga tanpa anggota ditolak saat dibuat", () => {
    expect(onCreating([]).error?.issues[0]?.message).toBe(
      "Tambahkan minimal satu anggota.",
    );
  });

  describe("pernikahan", () => {
    const couple = [
      { jemaatCode: "JMT-0001", roleInFamily: "SUAMI" as const },
      { jemaatCode: "JMT-0002", roleInFamily: "ISTRI" as const },
    ];

    test("suami dan istri sekaligus mewajibkan tanggal pernikahan", () => {
      const parsed = keluargaFormSchema.safeParse({
        ...VALID,
        members: couple,
      });

      expect(parsed.error?.issues.map((issue) => issue.path.join("."))).toEqual(
        ["marriage.date"],
      );
    });

    test("tanggalnya terisi: lolos, dan ikut terkirim", () => {
      const payload = toKeluargaPayload({
        ...VALID,
        members: couple,
        marriage: {
          date: "2015-08-20",
          place: "Gereja Pusat",
          certificateNumber: "",
        },
      });

      expect(payload.marriage).toEqual({
        date: "2015-08-20",
        place: "Gereja Pusat",
        certificateNumber: null,
      });
    });

    // Tanpa pasangan tidak ada siapa pun untuk dinikahi, dan backend menolak
    // data pernikahan yang tidak melengkapi siapa pun.
    test("tanpa pasangan, data pernikahan tidak dikirim", () => {
      const payload = toKeluargaPayload({
        ...VALID,
        marriage: { date: "2015-08-20", place: "", certificateNumber: "" },
      });

      expect(payload.marriage).toBeNull();
    });
  });

  test("keluarga dengan suami dan anak diterima", () => {
    expect(
      withMembers([
        {
          jemaatCode: "JMT-0001",
          roleInFamily: "SUAMI",
        },
        { jemaatCode: "JMT-0002", roleInFamily: "ANAK" },
      ]).success,
    ).toBe(true);
  });

  test("banyak anak diperbolehkan", () => {
    expect(
      withMembers([
        {
          jemaatCode: "JMT-0001",
          roleInFamily: "SUAMI",
        },
        { jemaatCode: "JMT-0002", roleInFamily: "ANAK" },
        { jemaatCode: "JMT-0003", roleInFamily: "ANAK" },
      ]).success,
    ).toBe(true);
  });
});

describe("endMembershipSchemaFor", () => {
  const CONTEXT = {
    partnerName: null as string | null,
    children: [] as { jemaatCode: string; name: string }[],
  };

  const parse = (values: Partial<EndMembershipValues>, context = {}) =>
    endMembershipSchemaFor({ ...CONTEXT, ...context }).safeParse({
      ...EMPTY_END_MEMBERSHIP,
      endedAt: "2026-03-01",
      endReason: "MENIKAH",
      ...values,
    });

  const messages = (values: Partial<EndMembershipValues>, context = {}) =>
    parse(values, context).error?.issues.map((issue) => issue.message) ?? [];

  test("bentuk awal tidak memilih alasan apa pun", () => {
    expect(EMPTY_END_MEMBERSHIP.endReason).toBe("");
  });

  test("alasan berakhir wajib dipilih, bukan diam-diam dianggap meninggal", () => {
    expect(messages({ endReason: "" })).toContain("Pilih alasan berakhir.");
  });

  test("tanggal berakhir wajib diisi", () => {
    expect(messages({ endedAt: "" })).toContain(
      "Tanggal berakhir wajib diisi.",
    );
  });

  test("tanpa syarat tambahan, isian dasar sudah cukup", () => {
    expect(parse({}).success).toBe(true);
  });

  // Pengganti tidak lagi wajib dijawab: backend meneruskan jabatannya sendiri
  // lewat rantai SUAMI → ISTRI → anak tertua. Dulu petugas dipaksa menyebut
  // nama, dan kematian dikecualikan sama sekali — yang meninggalkan KK janda
  // tanpa nama dan karena itu tidak bisa dicari.
  describe("kepala keluarga pengganti", () => {
    test("tidak wajib: dikosongkan berarti ikut urutan", () => {
      expect(parse({ newHeadJemaatCode: "" }).success).toBe(true);
    });

    test("terjawab juga diterima, dan menimpa urutan itu", () => {
      expect(parse({ newHeadJemaatCode: "JMT-02" }).success).toBe(true);
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
        parse({ endReason: "MEMISAHKAN_DIRI" }, { partnerName: "Rina" })
          .success,
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
    endReason: "MENIKAH",
  };

  test("catatan kosong dikirim null, bukan string kosong", () => {
    expect(
      toEndMembershipPayload({ ...base, endNote: "   " }).endNote,
    ).toBeNull();
  });

  test("alasan selain cerai tidak mengirim jawaban pasangan", () => {
    const payload = toEndMembershipPayload({
      ...base,
      endReason: "MEMISAHKAN_DIRI",
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

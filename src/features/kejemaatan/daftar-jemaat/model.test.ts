import { describe, expect, test } from "bun:test";

import {
  afterSavePath,
  EMPTY_JEMAAT_FORM,
  findDuplicate,
  JEMAAT_LIST_PATH,
  incompleteFields,
  jemaatFormSchema,
  normalizePhone,
  serverFieldError,
  toDateInput,
  toJemaatForm,
  toJemaatPayload,
  type JemaatFormValues,
} from "./model";
import type { JemaatDetail } from "./types";

/** Isian minimum yang sah untuk SIMPATISAN — dasar semua kasus di bawah. */
const SIMPATISAN: JemaatFormValues = {
  ...EMPTY_JEMAAT_FORM,
  name: "Maria Sitompul",
  gender: "P",
  birthPlace: "Bandung",
  birthDate: "1990-05-12",
  typeJemaat: "SIMPATISAN",
  statusJemaat: "AKTIF",
  provincesCode: "32",
  regenciesCode: "3273",
  districtsCode: "327301",
  villagesCode: "3273011001",
  address: "Jl. Merdeka 10, RT 01 RW 02",
};

const issuesOf = (values: JemaatFormValues) => {
  const parsed = jemaatFormSchema.safeParse(values);

  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => issue.path.join("."));
};

describe("jemaatFormSchema — wajib bersyarat (test wajib 1)", () => {
  test("Simpatisan tanpa golongan darah/pekerjaan/suku/wilayah/kode induk lolos", () => {
    expect(jemaatFormSchema.safeParse(SIMPATISAN).success).toBe(true);
  });

  /**
   * Sesudah penyesuaian be-sada 2026-09-23 yang tersisa EMPAT: golongan
   * darah, pekerjaan, dan pendidikan dilepas karena ketiganya sering
   * benar-benar tidak diketahui. Keempatnya harus menghasilkan pesan di
   * fieldnya masing-masing — bukan satu galat form tanpa alamat.
   */
  test("Anggota tanpa keempat field bersyarat ditolak per field", () => {
    expect(issuesOf({ ...SIMPATISAN, typeJemaat: "ANGGOTA" }).sort()).toEqual([
      "codeInduk",
      "ethnicGroupId",
      "statusMarital",
      "zoneChurchId",
    ]);
  });

  test("golongan darah, pekerjaan, dan pendidikan kosong tidak menolak Anggota", () => {
    const anggota: JemaatFormValues = {
      ...SIMPATISAN,
      typeJemaat: "ANGGOTA",
      codeInduk: "A-0184",
      zoneChurchId: "3",
      statusMarital: "BM",
      ethnicGroupId: "2",
      bloodType: "",
      professionId: "",
      lastEducation: "",
    };

    expect(jemaatFormSchema.safeParse(anggota).success).toBe(true);
  });

  test("tanggal lahir boleh kosong — tidak diketahui disimpan kosong", () => {
    expect(issuesOf({ ...SIMPATISAN, birthDate: "" })).toEqual([]);
    expect(
      toJemaatPayload({ ...SIMPATISAN, birthDate: "" }).birthDate,
    ).toBeNull();
  });
});

describe("jemaatFormSchema — batas nilai (test wajib 2)", () => {
  test("telepon non-angka ditolak", () => {
    expect(issuesOf({ ...SIMPATISAN, phone: "0812-3456" })).toEqual(["phone"]);
  });

  test("telepon lebih dari 12 angka ditolak", () => {
    expect(issuesOf({ ...SIMPATISAN, phone: "0812345678901" })).toEqual([
      "phone",
    ]);
  });

  test("telepon kosong diterima — keputusan user (B1)", () => {
    expect(issuesOf({ ...SIMPATISAN, phone: "" })).toEqual([]);
  });

  test("email tanpa @ ditolak", () => {
    expect(issuesOf({ ...SIMPATISAN, email: "maria.example.org" })).toEqual([
      "email",
    ]);
  });

  test("nama lebih dari 150 karakter ditolak", () => {
    expect(issuesOf({ ...SIMPATISAN, name: "M".repeat(151) })).toEqual([
      "name",
    ]);
  });
});

describe("jemaatFormSchema — keluarga dan peran (test wajib 3)", () => {
  test("keluarga dipilih tanpa peran ditolak", () => {
    expect(issuesOf({ ...SIMPATISAN, keluargaId: "12" })).toEqual([
      "roleInFamily",
    ]);
  });

  test("peran tanpa keluarga ditolak", () => {
    expect(issuesOf({ ...SIMPATISAN, roleInFamily: "ANAK" })).toEqual([
      "keluargaId",
    ]);
  });

  test("keduanya terisi diterima", () => {
    expect(
      issuesOf({ ...SIMPATISAN, keluargaId: "12", roleInFamily: "ANAK" }),
    ).toEqual([]);
  });
});

describe("toJemaatPayload", () => {
  test("tanggal dikirim YYYY-MM-DD, bukan ISO dengan jam (test wajib 4)", () => {
    const payload = toJemaatPayload({
      ...SIMPATISAN,
      additional: [
        {
          type: "BAPTIS",
          date: "2001-03-04",
          certificateNumber: "",
          place: "",
        },
      ],
    });

    expect(payload.birthDate).toBe("1990-05-12");
    expect(payload.additional?.[0].date).toBe("2001-03-04");
  });

  test("string kosong menjadi null, id menjadi angka", () => {
    const payload = toJemaatPayload({
      ...SIMPATISAN,
      email: "",
      phone: "",
      professionId: "7",
    });

    expect(payload.email).toBeNull();
    expect(payload.phone).toBeNull();
    expect(payload.professionId).toBe(7);
    expect(payload.keluargaId).toBeNull();
  });

  test("tanggal bergabung ikut sebagai tanggal atau null", () => {
    expect(toJemaatPayload(SIMPATISAN).joinedAt).toBeNull();
    expect(
      toJemaatPayload({ ...SIMPATISAN, joinedAt: "2024-01-07" }).joinedAt,
    ).toBe("2024-01-07");
  });
});

/**
 * Test wajib 5, DIBALIK setelah be-sada berubah 2026-09-23: `additional` yang
 * tidak dikirim kini berarti "jangan disentuh". Jadi form ubah justru HARUS
 * menghilangkan key-nya — mengirimnya dari layar yang tidak mengeditnya
 * adalah satu-satunya cara riwayat baptis/sidi/atestasi bisa tertimpa.
 */
describe("form ubah TIDAK mengirim additional (test wajib 5)", () => {
  const detail: JemaatDetail = {
    code: "JMT-0042",
    name: "Maria Sitompul",
    gender: "P",
    birthPlace: "Bandung",
    birthDate: "1990-05-12T00:00:00.000Z",
    email: "maria@example.org",
    phone: "08123456789",
    bloodType: "O",
    lastEducation: "SMA",
    statusMarital: "BM",
    professionId: 7,
    ethnicGroupId: 2,
    zoneChurchId: 3,
    codeInduk: "A-0184",
    provincesCode: "32",
    regenciesCode: "3273",
    districtsCode: "327301",
    villagesCode: "3273011001",
    address: "Jl. Merdeka 10",
    typeJemaat: "ANGGOTA",
    statusJemaat: "AKTIF",
    keluargaId: 12,
    roleInFamily: "ANAK",
    keluargaAsalId: null,
    joinedAt: "2018-02-11T00:00:00.000Z",
    additional: [
      {
        type: "BAPTIS",
        date: "1990-08-01T00:00:00.000Z",
        certificateNumber: "B/12/1990",
        place: "GKI Bandung",
      },
      {
        type: "SIDI",
        date: "2006-04-16T00:00:00.000Z",
        certificateNumber: null,
        place: null,
      },
    ],
  };

  test("mode ubah menghilangkan key additional sama sekali", () => {
    const payload = toJemaatPayload(toJemaatForm(detail), true);

    expect("additional" in payload).toBe(false);
  });

  test("mode tambah tetap mengirim riwayat yang diisi petugas", () => {
    const payload = toJemaatPayload(toJemaatForm(detail));

    expect(payload.additional).toEqual([
      {
        type: "BAPTIS",
        date: "1990-08-01",
        certificateNumber: "B/12/1990",
        place: "GKI Bandung",
      },
      {
        type: "SIDI",
        date: "2006-04-16",
        certificateNumber: null,
        place: null,
      },
    ]);
  });

  /**
   * Tiga field keluarga TETAP dikirim, juga saat kosong: `null` di sana
   * berarti "lepaskan dari keluarga", dan itu memang yang diminta user saat
   * ia mengosongkan kotaknya.
   */
  test("seluruh field detail ikut terkirim, bukan hanya yang disentuh", () => {
    const payload = toJemaatPayload(toJemaatForm(detail), true);

    expect(payload).toMatchObject({
      name: "Maria Sitompul",
      birthDate: "1990-05-12",
      email: "maria@example.org",
      bloodType: "O",
      professionId: 7,
      ethnicGroupId: 2,
      zoneChurchId: 3,
      codeInduk: "A-0184",
      keluargaId: 12,
      roleInFamily: "ANAK",
    });
  });

  test("detail hasil bacaan tetap lolos validasi form", () => {
    expect(jemaatFormSchema.safeParse(toJemaatForm(detail)).success).toBe(true);
  });
});

describe("serverFieldError (test wajib 6)", () => {
  test("Email Sudah Tersedia mendarat di field email", () => {
    expect(serverFieldError("Email Sudah Tersedia")?.field).toBe("email");
  });

  // Telepon tidak lagi unik di be-sada, jadi pesannya tidak pernah datang —
  // dan pemetaan yang tertinggal akan menyorot field yang tidak bersalah.
  test("No Handphone Sudah Tersedia sudah tidak dipetakan", () => {
    expect(serverFieldError("No Handphone Sudah Tersedia")).toBeNull();
  });

  test("Keluarga Asal menang atas Keluarga biasa", () => {
    expect(serverFieldError("Keluarga Asal Tidak Ditemukan")?.field).toBe(
      "keluargaAsalId",
    );
    expect(serverFieldError("Keluarga Tidak Ditemukan")?.field).toBe(
      "keluargaId",
    );
  });

  test("kepala keluarga ganda dipetakan ke peran, dengan kalimat sendiri", () => {
    const mapped = serverFieldError(
      'duplicate key value violates unique constraint "keluarga_member_one_head"',
    );

    expect(mapped?.field).toBe("roleInFamily");
    expect(mapped?.message).toContain("sudah punya kepala keluarga");
  });

  test("pesan yang tidak dikenal bukan galat field", () => {
    expect(serverFieldError("Kesalahan server.")).toBeNull();
  });
});

describe("pembantu", () => {
  test("normalizePhone membuang +62, spasi, dan tanda hubung", () => {
    expect(normalizePhone("+62 812-3456-7890")).toBe("081234567890");
    expect(normalizePhone("(0812) 3456 7890 123")).toBe("081234567890");
  });

  test("toDateInput memotong jam, tanpa menyentuh zona waktu", () => {
    expect(toDateInput("1990-05-12T00:00:00.000Z")).toBe("1990-05-12");
    expect(toDateInput(null)).toBe("");
  });

  test("incompleteFields menandai yang belum lengkap, tanpa menolak", () => {
    expect(incompleteFields(SIMPATISAN)).toEqual([
      "pendidikan terakhir",
      "pekerjaan",
      "telepon",
      "golongan darah",
    ]);

    expect(
      incompleteFields({
        ...SIMPATISAN,
        birthDate: "",
        isBirthDateUnknown: true,
      }),
    ).toContain("tanggal lahir");
  });
});

/**
 * Test wajib 8. Dua kegagalan yang dijaga di sini sama-sama tidak terlihat
 * sebagai galat: kembali ke daftar polos (filter petugas hilang) dan baris
 * baru yang tidak tersorot (petugas tidak tahu simpanannya masuk yang mana).
 */
describe("kembali ke daftar setelah simpan (test wajib 8)", () => {
  test("membawa filter terakhir dan menandai baris yang baru disimpan", () => {
    const url = `${JEMAAT_LIST_PATH}?status=TIDAK_AKTIF&page=3`;
    window.sessionStorage.setItem(`list-return:${JEMAAT_LIST_PATH}`, url);

    expect(afterSavePath("JMT-9001")).toBe(url);
    expect(
      window.sessionStorage.getItem(`list-focus:${JEMAAT_LIST_PATH}`),
    ).toBe("JMT-9001");
  });

  test("tanpa riwayat filter: daftar bersih, bukan URL karangan", () => {
    window.sessionStorage.clear();

    expect(afterSavePath("JMT-9002")).toBe(JEMAAT_LIST_PATH);
  });
});

/**
 * Test wajib 9 versi unit. Peringatan, bukan penolakan: kembar identik dan
 * nama umum itu nyata, dan menolak simpan berarti petugas yang benar tidak
 * punya jalan keluar sama sekali.
 */
describe("findDuplicate (test wajib 9)", () => {
  const rows = [
    {
      code: "JMT-0042",
      name: "Maria  Sitompul",
      birthDate: "1990-05-12T00:00:00.000Z",
    },
    { code: "JMT-0043", name: "Maria Sitompul", birthDate: null },
  ];

  test("nama mirip DAN tanggal lahir sama persis dianggap kembaran", () => {
    expect(
      findDuplicate(rows, { name: "maria sitompul", birthDate: "1990-05-12" })
        ?.code,
    ).toBe("JMT-0042");
  });

  test("nama sama tapi tanggal lahir berbeda bukan kembaran", () => {
    expect(
      findDuplicate(rows, { name: "Maria Sitompul", birthDate: "1991-05-12" }),
    ).toBeNull();
  });

  test("tanpa salah satunya, tidak ada yang bisa disimpulkan", () => {
    expect(
      findDuplicate(rows, { name: "", birthDate: "1990-05-12" }),
    ).toBeNull();
    expect(
      findDuplicate(rows, { name: "Maria Sitompul", birthDate: "" }),
    ).toBeNull();
  });

  test("mode ubah: jemaat itu sendiri bukan kembarannya", () => {
    expect(
      findDuplicate(
        rows,
        { name: "Maria Sitompul", birthDate: "1990-05-12" },
        "JMT-0042",
      ),
    ).toBeNull();
  });
});

/**
 * Galat MENGGANTIKAN petunjuk di slotnya, jadi informasi penting petunjuk
 * harus ikut dibawa galat. Kasus nyatanya: "kode induk juga jadi username"
 * dulu lenyap persis saat server menolak kode induknya.
 */
describe("pesan galat berdiri sendiri", () => {
  const messageOf = (values: JemaatFormValues, path: string) => {
    const parsed = jemaatFormSchema.safeParse(values);

    return parsed.success
      ? undefined
      : parsed.error.issues.find((issue) => issue.path.join(".") === path)
          ?.message;
  };

  test("kode induk kosong untuk Anggota menyebut akibatnya (username)", () => {
    expect(
      messageOf({ ...SIMPATISAN, typeJemaat: "ANGGOTA" }, "codeInduk"),
    ).toContain("username");
  });

  test("kode induk ditolak server juga menyebut username", () => {
    expect(serverFieldError("Kode Induk Sudah Tersedia")?.message).toContain(
      "username",
    );
  });

  test("alamat kosong membawa contohnya", () => {
    expect(messageOf({ ...SIMPATISAN, address: "" }, "address")).toContain(
      "mis.",
    );
  });

  test("telepon bukan angka membawa contohnya", () => {
    expect(messageOf({ ...SIMPATISAN, phone: "0812-3" }, "phone")).toContain(
      "mis.",
    );
  });

  test("tingkat alamat yang terkunci menyebut apa yang harus dipilih dulu", () => {
    expect(
      messageOf({ ...SIMPATISAN, regenciesCode: "" }, "regenciesCode"),
    ).toContain("provinsi");
  });
});

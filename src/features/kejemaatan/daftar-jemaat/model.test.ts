import { describe, expect, test } from "bun:test";

import {
  EMPTY_JEMAAT_FORM,
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
   * Keputusan user 2026-09-23: golongan darah TIDAK ikut dalam daftar ini
   * (B6). Yang tersisa enam, dan keenamnya harus menghasilkan pesan di
   * fieldnya masing-masing — bukan satu galat form tanpa alamat.
   */
  test("Anggota tanpa keenam field bersyarat ditolak per field", () => {
    expect(issuesOf({ ...SIMPATISAN, typeJemaat: "ANGGOTA" }).sort()).toEqual([
      "codeInduk",
      "ethnicGroupId",
      "lastEducation",
      "professionId",
      "statusMarital",
      "zoneChurchId",
    ]);
  });

  test("golongan darah kosong tidak menolak Anggota", () => {
    const anggota: JemaatFormValues = {
      ...SIMPATISAN,
      typeJemaat: "ANGGOTA",
      codeInduk: "A-0184",
      zoneChurchId: "3",
      statusMarital: "BM",
      professionId: "7",
      ethnicGroupId: "2",
      lastEducation: "SMA/SMK",
      bloodType: "",
    };

    expect(jemaatFormSchema.safeParse(anggota).success).toBe(true);
  });

  test('tanggal lahir boleh kosong bila ditandai "tidak diketahui"', () => {
    expect(issuesOf({ ...SIMPATISAN, birthDate: "" })).toEqual(["birthDate"]);
    expect(
      issuesOf({ ...SIMPATISAN, birthDate: "", isBirthDateUnknown: true }),
    ).toEqual([]);
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
    expect(payload.additional[0].date).toBe("2001-03-04");
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

  test('"tidak diketahui" mengirim birthDate null, bukan tanggal karangan', () => {
    const payload = toJemaatPayload({
      ...SIMPATISAN,
      birthDate: "1990-05-12",
      isBirthDateUnknown: true,
    });

    expect(payload.birthDate).toBeNull();
  });

  test("joinedAt hanya ikut bila diisi (menunggu B7)", () => {
    expect("joinedAt" in toJemaatPayload(SIMPATISAN)).toBe(false);
    expect(
      toJemaatPayload({ ...SIMPATISAN, joinedAt: "2024-01-07" }).joinedAt,
    ).toBe("2024-01-07");
  });
});

/**
 * Penjaga B2. Sampai be-sada berhenti menulis ulang `additional`, satu simpan
 * dari form ubah tanpa baris ini akan menghapus seluruh catatan baptis, sidi,
 * dan atestasi jemaat itu.
 */
describe("form ubah mengirim ulang seluruh additional (test wajib 5)", () => {
  const detail: JemaatDetail = {
    code: "JMT-0042",
    name: "Maria Sitompul",
    gender: "P",
    birthPlace: "Bandung",
    birthDate: "1990-05-12T00:00:00.000Z",
    email: "maria@example.org",
    phone: "08123456789",
    bloodType: "O",
    lastEducation: "SMA/SMK",
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

  test("detail → form → payload mempertahankan kedua baris riwayat", () => {
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

  test("seluruh field detail ikut terkirim, bukan hanya yang disentuh", () => {
    const payload = toJemaatPayload(toJemaatForm(detail));

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
  test("No Handphone Sudah Tersedia mendarat di field telepon", () => {
    expect(serverFieldError("No Handphone Sudah Tersedia")?.field).toBe(
      "phone",
    );
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

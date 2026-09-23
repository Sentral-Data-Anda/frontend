import { z } from "zod";

import type {
  JemaatAdditional,
  JemaatDetail,
  JemaatPayload,
  RoleInFamily,
} from "./types";

/**
 * Aturan form jemaat: cerminan `jemaatSchema` be-sada (form-pattern.md §1.2)
 * ditambah empat keputusan user 2026-09-23 yang MENDAHULUI kontrak hari ini,
 * karena backend sedang menyesuaikan diri ke arah yang sama:
 *
 * 1. **Telepon boleh kosong dan boleh sama** (B1). Bayi, anak, dan lansia
 *    tidak punya nomor; satu nomor rumah tangga dipakai bersama.
 * 2. **Golongan darah opsional** untuk Anggota (B6).
 * 3. **Yang tidak diketahui disimpan sebagai "tidak diketahui"**, bukan
 *    ditahan sampai lengkap — jemaatnya tetap tersimpan dan `incompleteFields`
 *    menandai apa yang masih kosong.
 * 4. **Kode induk bebas formatnya**, diketik petugas. Tidak ada pola yang
 *    divalidasi di sini; keunikannya tetap dijaga be-sada.
 *
 * SELURUH nilai form berupa string, termasuk id relasi. `<input>`, `<select>`,
 * dan combobox memang memberi string, dan satu tipe nilai berarti tidak ada
 * `undefined`/`NaN` yang menyelinap di antara "belum dipilih" dan "0".
 * Penerjemahannya ke tipe be-sada terjadi sekali, di `toJemaatPayload`.
 */

export const GENDERS = ["L", "P"] as const;
export const BLOOD_TYPES = ["A", "B", "AB", "O"] as const;
export const STATUS_PERNIKAHAN = ["SM", "BM", "CM", "CH"] as const;
export const TYPE_JEMAAT = ["ANGGOTA", "SIMPATISAN"] as const;
export const STATUS_JEMAAT = ["AKTIF", "TIDAK_AKTIF"] as const;
export const ROLE_IN_FAMILY = ["KEPALA_KELUARGA", "PASANGAN", "ANAK"] as const;
export const SACRAMENT_TYPES = [
  "BAPTIS",
  "SIDI",
  "ATESTASI_MASUK",
  "ATESTASI_KELUAR",
  "MENINGGAL",
] as const;

/** Nilai eksplisit untuk keputusan user 3 — bukan field yang dibiarkan kosong. */
export const UNKNOWN_EDUCATION = "Tidak diketahui";

/**
 * MENUNGGU BACKEND (B12): `lastEducation` masih teks bebas `VarChar(50)`,
 * sehingga "SMA", "S M A", dan "sma" menjadi tiga kelompok di
 * `/report/jemaat/last-education`. Daftar tetap di FE dulu; penegakannya
 * menyusul di be-sada.
 */
export const LAST_EDUCATION_OPTIONS = [
  "Tidak sekolah",
  "SD",
  "SMP",
  "SMA/SMK",
  "D1-D3",
  "D4/S1",
  "S2",
  "S3",
  UNKNOWN_EDUCATION,
] as const;

const optionalEnum = <T extends string>(values: readonly [T, ...T[]]) =>
  z.enum(values).or(z.literal(""));

const additionalSchema = z.object({
  type: optionalEnum(SACRAMENT_TYPES),
  date: z.string(),
  certificateNumber: z.string().max(50, "Nomor surat maksimal 50 karakter"),
  place: z.string().max(100, "Tempat maksimal 100 karakter"),
});

const baseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi")
    .max(150, "Nama maksimal 150 karakter"),
  gender: optionalEnum(GENDERS),
  birthPlace: z
    .string()
    .trim()
    .min(1, "Tempat lahir wajib diisi")
    .max(25, "Tempat lahir maksimal 25 karakter"),
  birthDate: z.string(),
  /** Keputusan user 3: tanggal lahir yang tidak diketahui tetap bisa disimpan. */
  isBirthDateUnknown: z.boolean(),

  typeJemaat: optionalEnum(TYPE_JEMAAT),
  statusJemaat: optionalEnum(STATUS_JEMAAT),
  codeInduk: z.string().trim().max(50, "Kode induk maksimal 50 karakter"),
  zoneChurchId: z.string(),
  /** MENUNGGU BACKEND (B7): dikirim hanya bila diisi. */
  joinedAt: z.string(),

  // 12 angka, bukan 15: kolomnya `VarChar(15)` tapi validatornya 12, dan yang
  // menolak lebih dulu yang menentukan.
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]*$/, "Telepon hanya boleh berisi angka")
    .max(12, "Telepon maksimal 12 angka"),
  // 150, bukan 250 (B4): validator be-sada menerima 250 sementara kolomnya
  // `VarChar(150)`, jadi 151–250 lolos validasi lalu jatuh sebagai galat 500.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(150, "Email maksimal 150 karakter"),

  provincesCode: z.string(),
  regenciesCode: z.string(),
  districtsCode: z.string(),
  villagesCode: z.string(),
  // 150, bukan 250 (B5): sama seperti email, yang menolak lebih dulu menang.
  address: z.string().trim().max(150, "Alamat maksimal 150 karakter"),

  keluargaId: z.string(),
  roleInFamily: optionalEnum(ROLE_IN_FAMILY),
  keluargaAsalId: z.string(),

  statusMarital: optionalEnum(STATUS_PERNIKAHAN),
  professionId: z.string(),
  ethnicGroupId: z.string(),
  lastEducation: z.string().trim().max(50, "Pendidikan maksimal 50 karakter"),
  /** Keputusan user 2 (B6): opsional, juga untuk Anggota. */
  bloodType: optionalEnum(BLOOD_TYPES),

  additional: z.array(additionalSchema),
});

/** Field yang wajib untuk semua jemaat, beserta pesannya. */
const ALWAYS_REQUIRED = [
  ["gender", "Jenis kelamin wajib dipilih"],
  ["provincesCode", "Provinsi wajib dipilih"],
  ["regenciesCode", "Kabupaten/kota wajib dipilih"],
  ["districtsCode", "Kecamatan wajib dipilih"],
  ["villagesCode", "Kelurahan/desa wajib dipilih"],
  ["address", "Alamat wajib diisi"],
  ["typeJemaat", "Tipe jemaat wajib dipilih"],
  ["statusJemaat", "Status jemaat wajib dipilih"],
] as const;

/**
 * Enam field yang wajib HANYA untuk Anggota — `superRefine` be-sada, dikurangi
 * golongan darah yang dilepas user (B6).
 */
const MEMBER_REQUIRED = [
  ["codeInduk", "Kode induk wajib diisi untuk Anggota"],
  ["zoneChurchId", "Wilayah wajib dipilih untuk Anggota"],
  ["statusMarital", "Status pernikahan wajib dipilih untuk Anggota"],
  ["professionId", "Pekerjaan wajib dipilih untuk Anggota"],
  ["ethnicGroupId", "Suku wajib dipilih untuk Anggota"],
  ["lastEducation", "Pendidikan terakhir wajib dipilih untuk Anggota"],
] as const;

export const jemaatFormSchema = baseSchema.superRefine((values, ctx) => {
  const onMissing = (path: string, message: string) =>
    ctx.addIssue({ code: "custom", path: [path], message });

  for (const [field, message] of ALWAYS_REQUIRED) {
    if (!values[field]) onMissing(field, message);
  }

  if (!values.isBirthDateUnknown && !values.birthDate) {
    onMissing(
      "birthDate",
      'Tanggal lahir wajib diisi, atau tandai "tidak diketahui"',
    );
  }

  if (values.typeJemaat === "ANGGOTA") {
    for (const [field, message] of MEMBER_REQUIRED) {
      if (!values[field]) onMissing(field, message);
    }
  }

  if (values.email && !values.email.includes("@")) {
    onMissing("email", "Email harus memuat @");
  }

  // Peran dan keluarga hanya bermakna berpasangan: `KeluargaMember` di be-sada
  // butuh keduanya, dan salah satunya sendirian diam-diam tidak tersimpan.
  if (values.keluargaId && !values.roleInFamily) {
    onMissing("roleInFamily", "Peran dalam keluarga wajib dipilih");
  }
  if (!values.keluargaId && values.roleInFamily) {
    onMissing("keluargaId", "Pilih keluarganya dulu, atau kosongkan peran");
  }

  values.additional.forEach((row, index) => {
    if (!row.type) {
      ctx.addIssue({
        code: "custom",
        path: ["additional", index, "type"],
        message: "Jenis riwayat wajib dipilih",
      });
    }
    if (!row.date) {
      ctx.addIssue({
        code: "custom",
        path: ["additional", index, "date"],
        message: "Tanggal riwayat wajib diisi",
      });
    }
  });
});

export type JemaatFormValues = z.infer<typeof baseSchema>;

export const EMPTY_JEMAAT_FORM: JemaatFormValues = {
  name: "",
  gender: "",
  birthPlace: "",
  birthDate: "",
  isBirthDateUnknown: false,
  typeJemaat: "",
  statusJemaat: "AKTIF",
  codeInduk: "",
  zoneChurchId: "",
  joinedAt: "",
  phone: "",
  email: "",
  provincesCode: "",
  regenciesCode: "",
  districtsCode: "",
  villagesCode: "",
  address: "",
  keluargaId: "",
  roleInFamily: "",
  keluargaAsalId: "",
  statusMarital: "",
  professionId: "",
  ethnicGroupId: "",
  lastEducation: "",
  bloodType: "",
  additional: [],
};

const emptyToNull = (value: string): string | null => value.trim() || null;

const idToNumber = (value: string): number | null =>
  value.trim() ? Number(value) : null;

/**
 * `YYYY-MM-DD` untuk `<input type="date">` dan untuk be-sada.
 *
 * Respons detail mengirim ISO lengkap ("1990-05-12T00:00:00.000Z"); dipotong
 * di sini, BUKAN lewat `new Date(...)`, supaya zona waktu tidak pernah ikut
 * menggeser tanggal kalender satu hari ke belakang (lib/format.ts menjelaskan
 * jebakan yang sama untuk sisi tampilan).
 */
export const toDateInput = (value: string | null | undefined): string =>
  value ? value.slice(0, 10) : "";

/**
 * Telepon: angka saja. Spasi, tanda hubung, tanda kurung, dan awalan `+62`
 * dibuang saat diketik supaya nomor yang disalin dari WhatsApp tidak ditolak
 * karena bentuknya.
 */
export const normalizePhone = (value: string): string =>
  value
    .replace(/^\+?62/, "0")
    .replace(/\D/g, "")
    .slice(0, 12);

/** Badan `POST`/`PUT`. Satu-satunya tempat nilai form menjadi tipe be-sada. */
export function toJemaatPayload(values: JemaatFormValues): JemaatPayload {
  const payload: JemaatPayload = {
    name: values.name.trim(),
    gender: values.gender as "L" | "P",
    birthPlace: values.birthPlace.trim(),
    // MENUNGGU BACKEND: validator be-sada masih mewajibkan `birthDate`,
    // padahal kolomnya nullable. Sampai ia melonggar, menandai "tidak
    // diketahui" menghasilkan 400 dari server — bukan isian yang hilang.
    birthDate: values.isBirthDateUnknown ? null : values.birthDate || null,
    email: emptyToNull(values.email),
    phone: emptyToNull(values.phone),
    bloodType: values.bloodType || null,
    lastEducation: emptyToNull(values.lastEducation),
    statusMarital: values.statusMarital || null,
    professionId: idToNumber(values.professionId),
    ethnicGroupId: idToNumber(values.ethnicGroupId),
    zoneChurchId: idToNumber(values.zoneChurchId),
    codeInduk: emptyToNull(values.codeInduk),
    provincesCode: values.provincesCode,
    regenciesCode: values.regenciesCode,
    districtsCode: values.districtsCode,
    villagesCode: values.villagesCode,
    address: values.address.trim(),
    typeJemaat: values.typeJemaat as "ANGGOTA" | "SIMPATISAN",
    statusJemaat: values.statusJemaat as "AKTIF" | "TIDAK_AKTIF",
    keluargaId: idToNumber(values.keluargaId),
    roleInFamily: (values.roleInFamily || null) as RoleInFamily | null,
    keluargaAsalId: idToNumber(values.keluargaAsalId),
    // Dikirim UTUH, termasuk baris yang datang dari detail dan tidak disentuh
    // layar ini: `PUT` menulis ulang seluruh riwayat, jadi payload tanpa
    // `additional` menghapus catatan baptis/sidi/atestasi (B2).
    additional: values.additional.map((row) => ({
      type: row.type as JemaatAdditional["type"],
      date: row.date,
      certificateNumber: emptyToNull(row.certificateNumber),
      place: emptyToNull(row.place),
    })),
  };

  if (values.joinedAt) payload.joinedAt = values.joinedAt;

  return payload;
}

/** Detail be-sada → nilai form. Field yang null menjadi string kosong. */
export function toJemaatForm(detail: JemaatDetail): JemaatFormValues {
  return {
    name: detail.name,
    gender: detail.gender,
    birthPlace: detail.birthPlace,
    birthDate: toDateInput(detail.birthDate),
    isBirthDateUnknown: !detail.birthDate,
    typeJemaat: detail.typeJemaat,
    statusJemaat: detail.statusJemaat,
    codeInduk: detail.codeInduk ?? "",
    zoneChurchId: detail.zoneChurchId?.toString() ?? "",
    joinedAt: toDateInput(detail.joinedAt),
    phone: detail.phone ?? "",
    email: detail.email ?? "",
    provincesCode: detail.provincesCode,
    regenciesCode: detail.regenciesCode,
    districtsCode: detail.districtsCode,
    villagesCode: detail.villagesCode,
    address: detail.address,
    keluargaId: detail.keluargaId?.toString() ?? "",
    roleInFamily: detail.roleInFamily ?? "",
    keluargaAsalId: detail.keluargaAsalId?.toString() ?? "",
    statusMarital: detail.statusMarital ?? "",
    professionId: detail.professionId?.toString() ?? "",
    ethnicGroupId: detail.ethnicGroupId?.toString() ?? "",
    lastEducation: detail.lastEducation ?? "",
    bloodType: detail.bloodType ?? "",
    additional: (detail.additional ?? []).map((row) => ({
      type: row.type,
      date: toDateInput(row.date),
      certificateNumber: row.certificateNumber ?? "",
      place: row.place ?? "",
    })),
  };
}

/**
 * Pesan unik be-sada → field yang salah (form-pattern.md §1.5, §3.7).
 *
 * Dicocokkan dengan teks karena galat 400 be-sada tidak membawa nama field
 * (B11). Yang tidak cocok bukan galat field, melainkan galat tingkat form —
 * menebak-nebak field di sini akan menyorot kotak yang tidak bersalah.
 */
const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof JemaatFormValues, string?]
> = [
  [/email sudah tersedia/i, "email"],
  [
    /no handphone sudah tersedia/i,
    "phone",
    "Nomor ini sudah dipakai jemaat lain. Satu nomor hanya boleh dipakai satu jemaat.",
  ],
  [/kode induk sudah tersedia/i, "codeInduk"],
  [/keluarga asal tidak ditemukan/i, "keluargaAsalId"],
  [/keluarga tidak ditemukan/i, "keluargaId"],
  [
    /one_head|kepala keluarga/i,
    "roleInFamily",
    "Keluarga ini sudah punya kepala keluarga. Pilih peran lain atau ubah kepala keluarga lewat layar Keluarga.",
  ],
];

export function serverFieldError(
  message: string,
): { field: keyof JemaatFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    // "Keluarga Asal Tidak Ditemukan" juga cocok dengan pola keluarga biasa,
    // jadi urutan daftar di atas yang menentukan — asal lebih dulu.
    if (pattern.test(message)) {
      return { field, message: override ?? message };
    }
  }

  return null;
}

/**
 * Data yang belum lengkap (keputusan user 3). Bukan galat: jemaatnya tetap
 * boleh disimpan, tapi petugas melihat apa yang masih menunggu dilengkapi.
 */
export function incompleteFields(values: {
  birthDate?: string;
  isBirthDateUnknown?: boolean;
  lastEducation?: string;
  professionId?: string;
  phone?: string;
  bloodType?: string;
}): string[] {
  const missing: string[] = [];

  if (values.isBirthDateUnknown || !values.birthDate) {
    missing.push("tanggal lahir");
  }
  if (!values.lastEducation || values.lastEducation === UNKNOWN_EDUCATION) {
    missing.push("pendidikan terakhir");
  }
  if (!values.professionId) missing.push("pekerjaan");
  if (!values.phone) missing.push("telepon");
  if (!values.bloodType) missing.push("golongan darah");

  return missing;
}

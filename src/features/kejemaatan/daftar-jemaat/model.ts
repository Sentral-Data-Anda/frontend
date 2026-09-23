import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { readListReturn, saveListFocus } from "@/lib/list-return";

import type {
  JemaatAdditional,
  JemaatDetail,
  JemaatPayload,
  RoleInFamily,
} from "./types";

/**
 * Aturan form jemaat, mengikuti kontrak be-sada SESUDAH penyesuaian
 * 2026-09-23 — bukan tabel §1.2 `form-pattern.md`, yang ditulis sebelum
 * backend berubah. Lima keputusan user yang mengubah bentuknya:
 *
 * 1. **Telepon opsional dan boleh sama.** Bayi, anak, dan lansia tidak punya
 *    nomor; satu nomor rumah tangga dipakai bersama. Pemeriksaan unik dicabut
 *    di be-sada, jadi tidak ada lagi galat "No Handphone Sudah Tersedia".
 * 2. **Golongan darah, pekerjaan, dan pendidikan tidak wajib** untuk Anggota.
 *    Yang tersisa wajib: status pernikahan, suku, wilayah, kode induk.
 * 3. **"Tidak diketahui" disimpan sebagai KOSONG (`null`)**, bukan sebagai
 *    nilai teks tersendiri. Dropdown boleh menawarkan pilihan berlabel
 *    "Tidak diketahui" — nilainya string kosong. Berlaku untuk tanggal lahir,
 *    pendidikan, dan pekerjaan.
 * 4. **Pendidikan terakhir jadi enum 12 nilai.** Teks bebas ditolak 400.
 * 5. **Kode induk bebas formatnya**, diketik petugas. Keunikannya dijaga
 *    be-sada.
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

export const LAST_EDUCATION = [
  "TIDAK_SEKOLAH",
  "SD",
  "SMP",
  "SMA",
  "SMK",
  "D1",
  "D2",
  "D3",
  "D4",
  "S1",
  "S2",
  "S3",
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
  /** Boleh kosong: tanggal lahir yang tidak diketahui disimpan sebagai null. */
  birthDate: z.string(),

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
    .regex(/^[0-9]*$/, "Telepon hanya angka, mis. 081234567890.")
    .max(12, "Telepon maksimal 12 angka"),
  // 150, selaras dengan kolomnya sejak be-sada menurunkan validatornya dari
  // 250: sebelumnya 151–250 lolos validasi lalu jatuh sebagai galat 500.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(150, "Email maksimal 150 karakter"),

  provincesCode: z.string(),
  regenciesCode: z.string(),
  districtsCode: z.string(),
  villagesCode: z.string(),
  // 250, selaras dengan kolomnya sejak be-sada menaikkan validatornya: alamat
  // Indonesia dengan RT/RW, blok, dan patokan rutin melewati 150.
  address: z.string().trim().max(250, "Alamat maksimal 250 karakter"),

  keluargaId: z.string(),
  roleInFamily: optionalEnum(ROLE_IN_FAMILY),
  keluargaAsalId: z.string(),

  statusMarital: optionalEnum(STATUS_PERNIKAHAN),
  professionId: z.string(),
  ethnicGroupId: z.string(),
  /** Enum sejak be-sada menutup teks bebas; kosong = tidak diketahui. */
  lastEducation: optionalEnum(LAST_EDUCATION),
  bloodType: optionalEnum(BLOOD_TYPES),

  additional: z.array(additionalSchema),
});

/**
 * Field yang wajib untuk semua jemaat, beserta pesannya.
 *
 * Pesan galat MENGGANTIKAN petunjuk di slotnya (`FormField`), jadi pesan
 * harus berdiri sendiri: contoh atau akibat yang tadinya dibawa petunjuk ikut
 * disebut di sini. Kalau tidak, informasi itu hilang tepat saat user paling
 * membutuhkannya — mis. "kode induk juga jadi username" lenyap persis ketika
 * kode induknya ditolak. Satu baris di 390, supaya slotnya tidak memanjang.
 */
const ALWAYS_REQUIRED = [
  ["gender", "Jenis kelamin wajib dipilih"],
  ["provincesCode", "Provinsi wajib dipilih"],
  ["regenciesCode", "Kabupaten/kota wajib dipilih, sesudah provinsi."],
  ["districtsCode", "Kecamatan wajib dipilih, sesudah kabupaten/kota."],
  ["villagesCode", "Kelurahan/desa wajib dipilih, sesudah kecamatan."],
  ["address", "Alamat wajib diisi, mis. Jl. Merdeka 10, RT 01 RW 02."],
  ["typeJemaat", "Pilih tipe jemaat; Anggota butuh kode induk dan wilayah."],
  ["statusJemaat", "Status jemaat wajib dipilih"],
] as const;

/**
 * Empat field yang wajib HANYA untuk Anggota, cerminan `superRefine` be-sada
 * sesudah 2026-09-23. Golongan darah, pekerjaan, dan pendidikan TIDAK ikut:
 * ketiganya sering benar-benar tidak diketahui, dan field wajib yang tidak
 * bisa dijawab jujur akan diisi asal.
 */
const MEMBER_REQUIRED = [
  ["codeInduk", "Kode induk wajib untuk Anggota; juga jadi username akun."],
  ["zoneChurchId", "Wilayah wajib untuk Anggota; dasar pembagian pelayanan."],
  ["statusMarital", "Status pernikahan wajib dipilih untuk Anggota"],
  ["ethnicGroupId", "Suku wajib dipilih untuk Anggota"],
] as const;

export const jemaatFormSchema = baseSchema.superRefine((values, ctx) => {
  const onMissing = (path: string, message: string) =>
    ctx.addIssue({ code: "custom", path: [path], message });

  for (const [field, message] of ALWAYS_REQUIRED) {
    if (!values[field]) onMissing(field, message);
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

/**
 * Badan `POST`/`PUT`. Satu-satunya tempat nilai form menjadi tipe be-sada.
 *
 * `isEdit` mengubah satu hal, dan hanya satu: **`additional` tidak ikut sama
 * sekali**. Sejak be-sada memperlakukan `additional` yang tidak dikirim
 * sebagai "jangan disentuh", mengirimnya dari layar yang tidak mengeditnya
 * adalah satu-satunya cara catatan baptis/sidi/atestasi bisa hilang: dua
 * orang membuka jemaat yang sama, satu menambah riwayat di layar Riwayat
 * Jemaat, yang lain menekan Simpan di sini, dan riwayat tadi tertimpa.
 *
 * Tiga field keluarga tetap dikirim (nilai atau `null`) karena layar ini
 * MEMANG memilikinya: `null` berarti "lepaskan dari keluarga", dan itu
 * memang yang diminta user saat ia mengosongkan kotaknya.
 */
export function toJemaatPayload(
  values: JemaatFormValues,
  isEdit = false,
): JemaatPayload {
  const payload: JemaatPayload = {
    name: values.name.trim(),
    gender: values.gender as "L" | "P",
    birthPlace: values.birthPlace.trim(),
    // Kosong = tidak diketahui, disimpan `null`. Tidak ada tanggal karangan.
    birthDate: emptyToNull(values.birthDate),
    email: emptyToNull(values.email),
    phone: emptyToNull(values.phone),
    bloodType: values.bloodType || null,
    lastEducation: values.lastEducation || null,
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
    joinedAt: emptyToNull(values.joinedAt),
  };

  if (!isEdit) {
    payload.additional = values.additional.map((row) => ({
      type: row.type as JemaatAdditional["type"],
      date: row.date,
      certificateNumber: emptyToNull(row.certificateNumber),
      place: emptyToNull(row.place),
    }));
  }

  return payload;
}

/** Detail be-sada → nilai form. Field yang null menjadi string kosong. */
export function toJemaatForm(detail: JemaatDetail): JemaatFormValues {
  return {
    name: detail.name,
    gender: detail.gender,
    birthPlace: detail.birthPlace,
    birthDate: toDateInput(detail.birthDate),
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
    lastEducation: (detail.lastEducation ??
      "") as JemaatFormValues["lastEducation"],
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
 * Pesan unik be-sada → field yang salah.
 *
 * Bukan pengganti `issues[]`: galat VALIDASI sudah membawa `path` sendiri
 * sejak 2026-09-23 dan diurus `applyServerError`. Yang tersisa di sini adalah
 * pemeriksaan yang dilakukan service SEBELUM menulis (keunikan, keberadaan
 * relasi, kepala keluarga tunggal) — pesannya tidak pernah punya `path`.
 *
 * "No Handphone Sudah Tersedia" sudah TIDAK ADA: telepon tidak lagi unik.
 */
const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof JemaatFormValues, string?]
> = [
  [/email sudah tersedia/i, "email"],
  [
    /kode induk sudah tersedia/i,
    "codeInduk",
    "Kode induk sudah dipakai jemaat lain; juga jadi username.",
  ],
  [
    /keluarga asal tidak ditemukan/i,
    "keluargaAsalId",
    "Keluarga asal tidak ditemukan; pilih ulang dari daftar.",
  ],
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
  if (!values.lastEducation) missing.push("pendidikan terakhir");
  if (!values.professionId) missing.push("pekerjaan");
  if (!values.phone) missing.push("telepon");
  if (!values.bloodType) missing.push("golongan darah");

  return missing;
}

export const JEMAAT_LIST_PATH = menuHref(MENU.KEJEMAATAN, MENU.DAFTAR_JEMAAT);

/**
 * Tujuan sesudah simpan: daftar yang SAMA seperti yang ditinggalkan petugas —
 * pencarian, filter status, dan halamannya — dengan baris yang baru disimpan
 * disorot sekali (docs/design/list-state.md §2.2, §2.4).
 *
 * Kembali ke `/kejemaatan/daftar-jemaat` polos berarti petugas yang sedang
 * menyisir "Tidak aktif" halaman 3 harus menyusun ulang filternya setiap kali
 * ia menambah satu orang — dan itu pekerjaan yang dia ulang puluhan kali.
 *
 * `saveListFocus` dipanggil DI SINI, bukan di layar: satu fungsi yang
 * memegang keduanya berarti tidak ada layar yang menyorot baris lalu lupa
 * membawa filternya, atau sebaliknya.
 */
export function afterSavePath(code: string): string {
  saveListFocus(JEMAAT_LIST_PATH, code);

  return readListReturn(JEMAAT_LIST_PATH);
}

/**
 * Kembaran yang mungkin: nama mirip DAN tanggal lahir sama persis.
 *
 * Nama saja tidak cukup — "Maria Sitompul" ada belasan di satu jemaat. Nama
 * mirip dengan tanggal lahir yang sama itulah yang hampir selalu berarti
 * orang yang sama dimasukkan dua kali (paling sering saat atestasi masuk,
 * bertahun kemudian baru ketahuan).
 *
 * Dibandingkan tanpa peduli huruf besar dan spasi ganda: "maria  sitompul"
 * dan "Maria Sitompul" adalah orang yang sama, dan yang mengetik ulang
 * memang jarang mengetiknya persis sama.
 */
const normalizeName = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

export function findDuplicate(
  rows: readonly { code: string; name: string; birthDate: string | null }[],
  values: { name: string; birthDate: string },
  /** Mode ubah: jemaat ini sendiri bukan kembarannya. */
  ownCode?: string,
) {
  if (!values.name.trim() || !values.birthDate) return null;

  return (
    rows.find(
      (row) =>
        row.code !== ownCode &&
        normalizeName(row.name) === normalizeName(values.name) &&
        toDateInput(row.birthDate) === values.birthDate,
    ) ?? null
  );
}

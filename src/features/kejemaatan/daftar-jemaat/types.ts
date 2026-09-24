import type { FilterChip } from "@/components/common/filter-chips";

/**
 * Bentuk satu baris `GET /api/v1/jemaat`.
 *
 * Disalin dari `jemaatService.findAllWithPagination` di be-sada, bukan
 * ditebak: service itu MEMETAKAN ULANG baris database sebelum mengirimnya
 * (`typeJemaat` → `type`, `statusJemaat` → `status`, dan `familyMemberships[0]`
 * diratakan jadi `roleInFamily` + `keluarga`). Daftar ini karena itu TIDAK
 * berisi field yang ada di endpoint detail — tidak ada `codeInduk`, `phone`,
 * maupun alamat.
 *
 * `zoneChurch` (be-sada B15, `8238471`) adalah wilayah EFEKTIF: wilayah
 * keluarga aktif bila ada, lalu wilayah pribadi jemaat — BUKAN selalu field
 * Wilayah di form (itu wilayah pribadi).
 *
 * `code` adalah kode jemaat (`JMT-…`), satu-satunya pengenal stabil yang
 * dikirim endpoint ini; `publicId` dan `id` sengaja ditahan be-sada.
 */
export type JemaatListItem = {
  code: string;
  name: string;
  gender: Gender;
  /** Calendar date (kolom `date`), bisa kosong. Format dengan `formatDate`. */
  birthDate: string | null;
  type: TypeJemaat;
  roleInFamily: RoleInFamily | null;
  keluarga: { id: number; code: string; name: string } | null;
  status: StatusJemaat;
  zoneChurch: { id: number; name: string } | null;
};

export type Gender = "L" | "P";
export type TypeJemaat = "ANGGOTA" | "SIMPATISAN";
export type StatusJemaat = "AKTIF" | "TIDAK_AKTIF";
export type RoleInFamily = "KEPALA_KELUARGA" | "PASANGAN" | "ANAK";

/**
 * Label Indonesia untuk enum be-sada.
 *
 * Enum-nya sudah berbahasa Indonesia, tapi dalam UPPER_SNAKE_CASE. Menampilkan
 * "TIDAK_AKTIF" apa adanya adalah membocorkan bentuk database ke layar; memberi
 * peta di sini juga berarti perubahan label tidak menyentuh satu pun komponen.
 */
export const STATUS_JEMAAT_LABEL: Record<StatusJemaat, string> = {
  AKTIF: "Aktif",
  TIDAK_AKTIF: "Tidak aktif",
};

export const TYPE_JEMAAT_LABEL: Record<TypeJemaat, string> = {
  ANGGOTA: "Anggota",
  SIMPATISAN: "Simpatisan",
};

export const ROLE_IN_FAMILY_LABEL: Record<RoleInFamily, string> = {
  KEPALA_KELUARGA: "Kepala keluarga",
  PASANGAN: "Pasangan",
  ANAK: "Anak",
};

/**
 * Nilai kosong berarti "tanpa filter": `toApiQuery` membuang parameter kosong,
 * dan `asString` di be-sada juga memperlakukan string kosong sebagai tidak ada.
 */
export const STATUS_JEMAAT_CHIPS: FilterChip[] = [
  { label: "Semua", value: "" },
  { label: STATUS_JEMAAT_LABEL.AKTIF, value: "AKTIF" },
  { label: STATUS_JEMAAT_LABEL.TIDAK_AKTIF, value: "TIDAK_AKTIF" },
];

export type BloodType = "A" | "B" | "AB" | "O";
export type StatusPernikahan = "SM" | "BM" | "CM" | "CH";
export type LastEducation =
  | "TIDAK_SEKOLAH"
  | "SD"
  | "SMP"
  | "SMA"
  | "SMK"
  | "D1"
  | "D2"
  | "D3"
  | "D4"
  | "S1"
  | "S2"
  | "S3";

export type SacramentType =
  "BAPTIS" | "SIDI" | "ATESTASI_MASUK" | "ATESTASI_KELUAR" | "MENINGGAL";

export const GENDER_LABEL: Record<Gender, string> = {
  L: "Laki-laki",
  P: "Perempuan",
};

export const BLOOD_TYPE_LABEL: Record<BloodType, string> = {
  A: "A",
  B: "B",
  AB: "AB",
  O: "O",
};

/**
 * Pendidikan terakhir jadi enum di be-sada (2026-09-23), menggantikan teks
 * bebas: "SMA", "S M A", dan "sma" dulu menjadi tiga baris di
 * `/report/jemaat/last-education`. Nilai KOSONG berarti tidak diketahui —
 * tidak ada anggota enum untuk itu.
 */
export const LAST_EDUCATION_LABEL: Record<LastEducation, string> = {
  TIDAK_SEKOLAH: "Tidak sekolah",
  SD: "SD",
  SMP: "SMP",
  SMA: "SMA",
  SMK: "SMK",
  D1: "D1",
  D2: "D2",
  D3: "D3",
  D4: "D4",
  S1: "S1",
  S2: "S2",
  S3: "S3",
};

export const STATUS_PERNIKAHAN_LABEL: Record<StatusPernikahan, string> = {
  SM: "Sudah menikah",
  BM: "Belum menikah",
  CM: "Cerai mati",
  CH: "Cerai hidup",
};

export const SACRAMENT_TYPE_LABEL: Record<SacramentType, string> = {
  BAPTIS: "Baptis",
  SIDI: "Sidi",
  ATESTASI_MASUK: "Atestasi masuk",
  ATESTASI_KELUAR: "Atestasi keluar",
  MENINGGAL: "Meninggal",
};

/**
 * Jenis yang hanya boleh SEKALI per jemaat — dijaga indeks SQL
 * `riwayat_jemaat_once_per_type` di be-sada. Form menyembunyikan jenis yang
 * sudah dipakai dari pilihan baris berikutnya, supaya penolakannya tidak
 * datang sebagai galat 500 setelah semua field lain terisi.
 */
export const SACRAMENT_ONCE: readonly SacramentType[] = [
  "BAPTIS",
  "SIDI",
  "MENINGGAL",
];

/** Satu baris `additional[]`: riwayat baptis/sidi/atestasi. */
export type JemaatAdditional = {
  type: SacramentType;
  /** Calendar date. Detail mengirim ISO lengkap; form memotongnya ke YYYY-MM-DD. */
  date: string;
  certificateNumber: string | null;
  place: string | null;
};

/**
 * Badan `POST /jemaat` dan `PUT /jemaat/:code`, apa adanya.
 *
 * `PUT` MENGGANTI SELURUHNYA (form-pattern.md §1.7): field opsional yang tidak
 * dikirim menjadi `null`. Karena itu form ubah memuat detail lebih dulu dan
 * mengirim seluruh objek — termasuk `additional` yang tidak diedit di layar
 * ini (penjaga B2).
 */
export type JemaatPayload = {
  name: string;
  gender: Gender;
  birthPlace: string;
  birthDate: string | null;
  email: string | null;
  phone: string | null;
  bloodType: BloodType | null;
  lastEducation: LastEducation | null;
  statusMarital: StatusPernikahan | null;
  professionId: number | null;
  ethnicGroupId: number | null;
  zoneChurchId: number | null;
  codeInduk: string | null;
  provincesCode: string;
  regenciesCode: string;
  districtsCode: string;
  villagesCode: string;
  address: string;
  typeJemaat: TypeJemaat;
  statusJemaat: StatusJemaat;
  keluargaId: number | null;
  roleInFamily: RoleInFamily | null;
  keluargaAsalId: number | null;
  /** Tanggal jemaat bergabung di gereja ini — bukan tanggal pencatatan. */
  joinedAt: string | null;
  /**
   * HANYA dikirim saat TAMBAH. Pada `PUT`, key yang tidak ada berarti "jangan
   * disentuh", dan itulah yang melindungi riwayat baptis/sidi/atestasi dari
   * layar yang tidak mengeditnya.
   */
  additional?: JemaatAdditional[];
};

/**
 * `GET /jemaat/:code`. Field relasi datang sebagai id saja — nama pekerjaan,
 * suku, dan wilayah TIDAK ikut (B8), jadi form ubah menampilkan nilainya
 * setelah daftar pilihannya termuat.
 */
export type JemaatDetail = Omit<JemaatPayload, "additional"> & {
  code: string;
  additional: JemaatAdditional[] | null;
};

/** Satu baris `GET /ddl/*`. `villages` menambah `postalCode`. */
export type DdlOption = {
  id: number;
  code: string;
  name: string;
};

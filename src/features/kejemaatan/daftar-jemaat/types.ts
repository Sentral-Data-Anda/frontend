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

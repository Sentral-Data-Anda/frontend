export const MISSING_FIELD_KEYS = [
  "birthPlace",
  "address",
  "provincesCode",
  "regenciesCode",
  "districtsCode",
  "villagesCode",
  "statusMarital",
  "ethnicGroupId",
  "codeInduk",
] as const;

export type MissingFieldKey = (typeof MISSING_FIELD_KEYS)[number];

export const MISSING_FIELD_LABEL = {
  birthPlace: "Tempat lahir",
  address: "Alamat lengkap",
  provincesCode: "Provinsi",
  regenciesCode: "Kabupaten/kota",
  districtsCode: "Kecamatan",
  villagesCode: "Kelurahan/desa",
  statusMarital: "Status pernikahan",
  ethnicGroupId: "Suku",
  codeInduk: "Kode induk",
} satisfies Record<MissingFieldKey, string>;

export const missingFieldLabels = (
  fields: readonly MissingFieldKey[],
): string[] => fields.map((field) => MISSING_FIELD_LABEL[field]);

const HARD_MISSING_FIELD_KEYS = new Set<MissingFieldKey>([
  "birthPlace",
  "address",
  "statusMarital",
  "ethnicGroupId",
  "codeInduk",
]);

export const hasHardMissingFields = (
  fields: readonly MissingFieldKey[],
): boolean => fields.some((field) => HARD_MISSING_FIELD_KEYS.has(field));

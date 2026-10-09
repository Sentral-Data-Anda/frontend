import { z } from "zod";

import type { SelectOption } from "@/components/common/control";
import { MENU, menuHref } from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";
import { formatRupiahCompact } from "@/lib/format";
import {
  APPROVAL_DOCUMENT_LABEL,
  APPROVAL_DOCUMENT_TYPES,
  amountUnitOf,
  formatApprovalAmount,
  type AmountUnit,
  type ApprovalDocumentType,
} from "@/types/persetujuan";

import type { SetelanItem, SetelanPayload, SetelanStep } from "./types";

export const SETELAN_LIST_PATH = menuHref(
  MENU.APPROVAL,
  MENU.APPROVAL_WORKFLOW,
);

export const MAX_TIERS = 10;

export const CONFIGURABLE_DOCUMENT_TYPES = APPROVAL_DOCUMENT_TYPES.filter(
  (type) => type !== "LOAN_ROOM",
);

const toOption = (type: ApprovalDocumentType): SelectOption => ({
  value: type,
  label: APPROVAL_DOCUMENT_LABEL[type],
});

export const DOCUMENT_FORM_OPTIONS = CONFIGURABLE_DOCUMENT_TYPES.map(toOption);

export const documentOptionsFor = (current: string): SelectOption[] =>
  current === "LOAN_ROOM"
    ? [
        ...DOCUMENT_FORM_OPTIONS,
        {
          value: current,
          label: `${APPROVAL_DOCUMENT_LABEL.LOAN_ROOM} (tidak dipakai lagi)`,
        },
      ]
    : DOCUMENT_FORM_OPTIONS;

export const DOCUMENT_FILTER_OPTIONS: SelectOption[] = [
  { value: "", label: "Semua jenis dokumen" },
  ...APPROVAL_DOCUMENT_TYPES.map(toOption),
];

export const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: "", label: "Semua" },
  { value: "true", label: "Aktif" },
  { value: "false", label: "Nonaktif" },
];

export function toSetelanQuery(apiQuery: string): string {
  const query = new URLSearchParams(apiQuery);
  const status = query.get("status");

  query.delete("status");
  if (status) query.set("isActive", status);

  return query.toString();
}

export const unitOf = (documentType: string): AmountUnit =>
  amountUnitOf(documentType as ApprovalDocumentType);

export const previewAmount = (documentType: string, value: string): string =>
  formatApprovalAmount(documentType as ApprovalDocumentType, value);

export const amountLabelsOf = (documentType: string) =>
  unitOf(documentType) === "hari"
    ? { min: "Jumlah hari minimal", max: "Jumlah hari maksimal" }
    : { min: "Nominal minimal (Rp)", max: "Nominal maksimal (Rp)" };

const rangeMessageOf = (documentType: string) =>
  unitOf(documentType) === "hari"
    ? "Jumlah hari maksimal tidak boleh lebih kecil dari jumlah hari minimal."
    : "Nominal maksimal tidak boleh lebih kecil dari nominal minimal.";

export function rangeLabel(
  type: ApprovalDocumentType,
  min: string | null,
  max: string | null,
  isCompact = false,
): string {
  const format = (value: string) =>
    isCompact && amountUnitOf(type) === "rupiah"
      ? formatRupiahCompact(Number(value))
      : formatApprovalAmount(type, value);

  if (min === null && max === null) return "Semua nominal";
  if (max === null) return `Mulai ${format(min as string)}`;
  if (min === null) return `Sampai ${format(max)}`;
  if (Number(min) === Number(max)) return format(min);

  return `${format(min)} – ${format(max)}`;
}

export const tierLabel = (step: SetelanStep): string =>
  step.approverRoleUserId !== null
    ? (step.approverRoleUser?.name ?? "")
    : `${step.approverRoleName ?? ""} · ${step.approverBapel?.name ?? "BP pengaju"}`;

export const tierChainOf = (item: SetelanItem): string =>
  item.steps.map(tierLabel).join(" → ");

export function withSavedJabatan(
  options: readonly SelectOption[],
  value: string,
  isLoaded: boolean,
): { options: readonly SelectOption[]; isMissing: boolean } {
  const key = value.trim().toLowerCase();
  const isListed = options.some((option) => option.value === value);
  const isHeld = options.some(
    (option) => option.value.trim().toLowerCase() === key,
  );

  return {
    options:
      !value || isListed ? options : [...options, { value, label: value }],
    isMissing: Boolean(value) && isLoaded && !isHeld,
  };
}

const isConfigurable = (value: string) =>
  (CONFIGURABLE_DOCUMENT_TYPES as readonly string[]).includes(value);

const DIGITS = /^\d*$/;

const tierSchema = z.object({
  kind: z.enum(["role", "position"]),
  roleUserId: z.string(),
  roleName: z.string(),
  bapelId: z.string(),
});

type TierValues = z.input<typeof tierSchema>;

const tierKeyOf = (tier: TierValues): string | null => {
  if (tier.kind === "role") {
    return tier.roleUserId ? `role:${tier.roleUserId}` : null;
  }

  const name = tier.roleName.trim().toLowerCase();

  return name ? `position:${name}:${tier.bapelId || "pengaju"}` : null;
};

export const signerFieldOf = (tier: TierValues) =>
  tier.kind === "role" ? "roleUserId" : "roleName";

// Semua aturan di superRefine: zod 4 melewatkannya bila field dasar sudah gagal.
export const setelanFormSchema = z
  .object({
    name: z.string(),
    documentType: z.string(),
    bapelId: z.string(),
    minAmount: z.string(),
    maxAmount: z.string(),
    isActive: z.enum(["true", "false"]),
    tiers: z.array(tierSchema),
  })
  .superRefine((values, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });
    const name = values.name.trim();

    if (!name) add(["name"], "Isi nama alur.");
    else if (name.length > 100)
      add(["name"], "Nama alur maksimal 100 karakter.");

    if (!values.documentType) add(["documentType"], "Pilih jenis dokumen.");
    else if (!isConfigurable(values.documentType)) {
      add(
        ["documentType"],
        "Jenis dokumen ini tidak bisa dipakai lagi. Pilih jenis lain.",
      );
    }

    for (const key of ["minAmount", "maxAmount"] as const) {
      if (!DIGITS.test(values[key])) {
        add([key], "Isi angka tanpa titik atau koma.");
      }
    }

    const { minAmount, maxAmount } = values;
    const isRangeReadable =
      DIGITS.test(minAmount) &&
      DIGITS.test(maxAmount) &&
      minAmount &&
      maxAmount;

    if (isRangeReadable && Number(maxAmount) < Number(minAmount)) {
      add(["maxAmount"], rangeMessageOf(values.documentType));
    }

    if (values.tiers.length === 0)
      add(["tiers"], "Tambahkan minimal satu tahap.");
    if (values.tiers.length > MAX_TIERS) add(["tiers"], "Maksimal 10 tahap.");

    const seen = new Map<string, number>();

    values.tiers.forEach((tier, index) => {
      const field = signerFieldOf(tier);
      const key = tierKeyOf(tier);

      if (!key) {
        add(
          ["tiers", index, field],
          tier.kind === "role"
            ? "Pilih role penanda tangan."
            : "Pilih nama jabatan.",
        );
        return;
      }

      const first = seen.get(key);

      if (first === undefined) seen.set(key, index);
      else {
        add(
          ["tiers", index, field],
          `Penanda tangan ini sudah ada di tahap ${first + 1}. Pilih yang lain atau hapus tahap ini.`,
        );
      }
    });
  });

export type SetelanFormValues = z.input<typeof setelanFormSchema>;

export type SetelanTierValues = SetelanFormValues["tiers"][number];

export const EMPTY_TIER: SetelanTierValues = {
  kind: "role",
  roleUserId: "",
  roleName: "",
  bapelId: "",
};

export const EMPTY_SETELAN_FORM: SetelanFormValues = {
  name: "",
  documentType: "",
  bapelId: "",
  minAmount: "",
  maxAmount: "",
  isActive: "true",
  tiers: [EMPTY_TIER],
};

const amountOf = (value: string) => (value === "" ? null : Number(value));

const idOf = (value: string) => (value ? Number(value) : null);

export function toSetelanPayload(values: SetelanFormValues): SetelanPayload {
  return {
    name: values.name.trim(),
    documentType: values.documentType as ApprovalDocumentType,
    bapelId: idOf(values.bapelId),
    minAmount: amountOf(values.minAmount),
    maxAmount: amountOf(values.maxAmount),
    isActive: values.isActive === "true",
    tiers: values.tiers.map((tier) =>
      tier.kind === "role"
        ? { roleUserId: Number(tier.roleUserId), roleName: null, bapelId: null }
        : {
            roleUserId: null,
            roleName: tier.roleName.trim(),
            bapelId: idOf(tier.bapelId),
          },
    ),
  };
}

const amountInputOf = (value: string | null) =>
  value === null ? "" : String(Number(value));

export function toSetelanForm(detail: SetelanItem): SetelanFormValues {
  return {
    name: detail.name,
    documentType: detail.documentType,
    bapelId: detail.bapelId === null ? "" : String(detail.bapelId),
    minAmount: amountInputOf(detail.minAmount),
    maxAmount: amountInputOf(detail.maxAmount),
    isActive: detail.isActive ? "true" : "false",
    tiers: detail.steps.map((step) =>
      step.approverRoleUserId !== null
        ? { ...EMPTY_TIER, roleUserId: String(step.approverRoleUserId) }
        : {
            kind: "position",
            roleUserId: "",
            roleName: step.approverRoleName ?? "",
            bapelId:
              step.approverBapelId === null ? "" : String(step.approverBapelId),
          },
    ),
  };
}

type ServerField = "minAmount" | "maxAmount" | "root";

const SERVER_FIELD_ERROR: ReadonlyArray<[RegExp, ServerField, string]> = [
  [
    /bertumpang tindih/i,
    "minAmount",
    "Rentang ini bertumpang tindih dengan alur aktif lain untuk jenis dokumen dan badan pelayanan yang sama. Batas ikut dihitung; geser rentangnya atau nonaktifkan alur yang lain.",
  ],
  [
    /rentang nominal alur persetujuan tidak valid/i,
    "maxAmount",
    "Nominal maksimal tidak boleh lebih kecil dari nominal minimal.",
  ],
  [
    /^role penyetuju tidak ditemukan/i,
    "root",
    "Salah satu role penanda tangan sudah dihapus. Pilih ulang role di tahapan.",
  ],
  [
    /^bapel tidak ditemukan/i,
    "root",
    "Badan pelayanan yang dipilih sudah dihapus. Pilih ulang.",
  ],
];

export function serverFieldError(
  message: string,
): { field: ServerField; message: string } | null {
  const hit = SERVER_FIELD_ERROR.find(([pattern]) => pattern.test(message));

  return hit ? { field: hit[1], message: hit[2] } : null;
}

const TIER_SIGNER_PATH = /^tiers\.(\d+)\.roleUserId$/;

export function withTierIssuePaths(
  error: unknown,
  tiers: readonly SetelanTierValues[],
): unknown {
  if (!(error instanceof FetchError) || error.issues.length === 0) return error;

  const issues = error.issues.map((issue) => {
    const index = TIER_SIGNER_PATH.exec(issue.path)?.[1];

    return index !== undefined && tiers[Number(index)]?.kind === "position"
      ? { ...issue, path: `tiers.${index}.roleName` }
      : issue;
  });

  return new FetchError(error.status, error.message, issues, error.code);
}

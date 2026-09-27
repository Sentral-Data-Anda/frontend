/**
 * Tiruan be-sada `/setelan-persetujuan` dan `/ddl/jabatan-jemaat` (cabang persetujuan-fe-gaps).
 *
 *   MOCK_EMPTY=1                    → daftar alur kosong (404)
 *   MOCK_500=1                      → daftar alur menjawab 500
 *   MOCK_SETELAN_SAVE_ERROR=500     → POST/PUT/DELETE alur menjawab 500
 *   MOCK_DDL_EMPTY=1                → /ddl/jabatan-jemaat kosong (404)
 *
 * 409 tumpang tindih muncul alami: buat "Kas keluar" umum 5.000.000–6.000.000, atau aktifkan
 * lagi "Kas keluar lama". Komisi Diakonia tidak punya jabatan (opsi Nama jabatan kosong).
 */
import { z } from "zod";

import { MENU } from "../../../src/config/menu";
import {
  APPROVAL_DOCUMENT_TYPES as ALL_TYPES,
  type ApprovalDocumentType,
} from "../../../src/types/persetujuan";
import { ROLE_USERS, SESSION_USER_ID, ddlRows } from "../../mock-dashboard";
import { denied, json, list, readBody, type MockHandler } from "../kit";

type Ref = { id: number; code: string; name: string };

type Step = {
  roleUserId: number | null;
  roleName: string | null;
  bapelId: number | null;
};

type Config = {
  id: number;
  publicId: string;
  name: string;
  documentType: ApprovalDocumentType;
  bapelId: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedBy: number | null;
  updatedAt: string | null;
  steps: (Step & { publicId: string })[];
};

const BAPEL = (ddlRows("bapel", new URLSearchParams()) ?? []) as Ref[];

const APPROVAL_DOCUMENT_TYPES = [
  "PURCHASE_REQUEST",
  "PROGRAM",
  "PROGRAM_MENDADAK",
  "BUDGET_USAGE_REPORT",
  "CASH_EXPENSE",
  "LEAVE_REQUEST",
  "PAYROLL_RUN",
  "PURCHASE_RETURN",
] as const;

const isBlank = (value: unknown) =>
  value === undefined || value === null || value === "";

const formBoolean = () =>
  z.preprocess((value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "on", "yes"].includes(normalized)) return true;
      if (["false", "0", "off", "no", ""].includes(normalized)) return false;
    }
    return value;
  }, z.boolean());

const optionalFormNumber = () =>
  z.preprocess(
    (value) => (isBlank(value) ? null : value),
    z.coerce.number().nullable(),
  );

const optionalFormString = () =>
  z.preprocess(
    (value) => (isBlank(value) ? null : value),
    z.string().nullable(),
  );

const tierSchema = z
  .object({
    roleUserId: optionalFormNumber(),
    roleName: optionalFormString().refine(
      (value) => value === null || value.trim().length <= 50,
      { error: "Nama Jabatan tidak boleh lebih dari 50 karakter" },
    ),
    bapelId: optionalFormNumber(),
  })
  .superRefine((tier, ctx) => {
    const named = tier.roleName !== null && tier.roleName.trim().length > 0;

    if (named === (tier.roleUserId !== null)) {
      ctx.addIssue({
        code: "custom",
        path: ["roleUserId"],
        message:
          "Setiap tahapan harus menunjuk tepat satu penanda tangan: Role Sistem atau Jabatan Komisi",
      });
      return;
    }
    if (!named && tier.bapelId !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["bapelId"],
        message: "Bapel hanya dapat diisi untuk tahapan berupa Jabatan Komisi",
      });
    }
  });

const tierKey = (tier: Step) =>
  tier.roleUserId !== null
    ? `role:${tier.roleUserId}`
    : `position:${(tier.roleName ?? "").trim().toLowerCase()}:${tier.bapelId ?? "pengaju"}`;

const optionalAmount = (label: string) =>
  optionalFormNumber().refine((value) => value === null || value >= 0, {
    error: `${label} tidak boleh negatif`,
  });

const setelanSchema = z
  .object({
    name: z
      .string({ error: "Mohon Lengkapi Nama Alur" })
      .trim()
      .min(1, { error: "Mohon Lengkapi Nama Alur" })
      .max(100, { error: "Nama Alur tidak boleh lebih dari 100 karakter" }),
    documentType: z.enum(APPROVAL_DOCUMENT_TYPES, {
      error: "Jenis Dokumen tidak dikenali",
    }),
    bapelId: optionalFormNumber(),
    minAmount: optionalAmount("Nominal Minimal"),
    maxAmount: optionalAmount("Nominal Maksimal"),
    isActive: formBoolean().optional().default(true),
    tiers: z
      .array(tierSchema)
      .min(1, { error: "Alur Persetujuan harus memiliki minimal 1 tahapan" })
      .max(10, { error: "Alur Persetujuan tidak boleh lebih dari 10 tahapan" }),
  })
  .superRefine((config, ctx) => {
    const keys = config.tiers.map(tierKey);
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({
        code: "custom",
        path: ["tiers"],
        message: "Satu Penanda Tangan Tidak Boleh Mengisi Dua Tahapan",
      });
    }
    if (
      config.minAmount !== null &&
      config.maxAmount !== null &&
      config.maxAmount < config.minAmount
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maxAmount"],
        message:
          "Nominal Maksimal tidak boleh lebih kecil dari Nominal Minimal",
      });
    }
  });

const role = (id: number): Step => ({
  roleUserId: id,
  roleName: null,
  bapelId: null,
});
const position = (roleName: string, bapelId: number | null = null): Step => ({
  roleUserId: null,
  roleName,
  bapelId,
});

const BENDAHARA = 4;
const MAJELIS = 5;
const SEKRETARIAT = 2;
const KOMISI_PEMUDA = 2;

const SEED: [
  string,
  ApprovalDocumentType,
  number | null,
  number | null,
  number | null,
  boolean,
  Step[],
][] = [
  [
    "Kas keluar kecil",
    "CASH_EXPENSE",
    null,
    0,
    5_000_000,
    true,
    [role(BENDAHARA)],
  ],
  [
    "Kas keluar besar",
    "CASH_EXPENSE",
    null,
    5_000_001,
    null,
    true,
    [role(BENDAHARA), role(MAJELIS)],
  ],
  [
    "Kas keluar Komisi Pemuda",
    "CASH_EXPENSE",
    KOMISI_PEMUDA,
    0,
    null,
    true,
    [position("Ketua"), role(BENDAHARA)],
  ],
  [
    "Program",
    "PROGRAM",
    null,
    null,
    null,
    true,
    [position("Ketua"), role(MAJELIS)],
  ],
  [
    "Program mendadak",
    "PROGRAM_MENDADAK",
    null,
    null,
    null,
    true,
    [position("Ketua"), role(BENDAHARA), role(MAJELIS)],
  ],
  ["Cuti singkat", "LEAVE_REQUEST", null, 1, 3, true, [role(SEKRETARIAT)]],
  [
    "Cuti panjang",
    "LEAVE_REQUEST",
    null,
    4,
    null,
    true,
    [role(SEKRETARIAT), role(MAJELIS)],
  ],
  [
    "Kas keluar lama",
    "CASH_EXPENSE",
    null,
    0,
    10_000_000,
    false,
    [role(BENDAHARA)],
  ],
];

const seedUuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

let nextId = SEED.length + 1;

const withStepIds = (steps: Step[]) =>
  steps.map((step) => ({ ...step, publicId: crypto.randomUUID() }));

const configs: Config[] = SEED.map(
  (
    [name, documentType, bapelId, minAmount, maxAmount, isActive, steps],
    index,
  ) => ({
    id: index + 1,
    publicId: seedUuid(index + 1),
    name,
    documentType,
    bapelId,
    minAmount,
    maxAmount,
    isActive,
    createdBy: SESSION_USER_ID,
    createdAt: "2026-09-01T02:00:00.000Z",
    updatedBy: null,
    updatedAt: null,
    steps: withStepIds(steps),
  }),
);

const bapelOf = (id: number | null) =>
  id === null ? undefined : BAPEL.find((bapel) => bapel.id === id);

const toResponse = ({ steps, ...config }: Config) => {
  const bapel = bapelOf(config.bapelId);
  const roleOf = (id: number | null) => ROLE_USERS.find((row) => row.id === id);

  return {
    ...config,
    minAmount: config.minAmount === null ? null : String(config.minAmount),
    maxAmount: config.maxAmount === null ? null : String(config.maxAmount),
    bapel: bapel ? { code: bapel.code, name: bapel.name } : null,
    steps: steps.map((step, index) => {
      const approverRole = roleOf(step.roleUserId);
      const approverBapel = bapelOf(step.bapelId);

      return {
        publicId: step.publicId,
        order: index + 1,
        approverRoleUserId: step.roleUserId,
        approverRoleName:
          step.roleUserId === null ? (step.roleName ?? "").trim() : null,
        approverBapelId: step.roleUserId === null ? step.bapelId : null,
        approverRoleUser: approverRole
          ? { publicId: `role-${approverRole.id}`, name: approverRole.name }
          : null,
        approverBapel: approverBapel
          ? {
              publicId: `bapel-${approverBapel.id}`,
              code: approverBapel.code,
              name: approverBapel.name,
            }
          : null,
      };
    }),
  };
};

const byTypeThenId = (a: Config, b: Config) =>
  ALL_TYPES.indexOf(a.documentType) - ALL_TYPES.indexOf(b.documentType) ||
  a.id - b.id;

const failure = (status: number, error: string) =>
  json({ status, error }, status);

const notFound = () => failure(404, "Alur Persetujuan Tidak Ditemukan");

const isOverlap = (next: Omit<Config, "steps" | "createdAt">) =>
  next.isActive &&
  configs.some(
    (row) =>
      row.id !== next.id &&
      row.isActive &&
      row.documentType === next.documentType &&
      (row.bapelId ?? -1) === (next.bapelId ?? -1) &&
      (row.minAmount ?? 0) <= (next.maxAmount ?? Infinity) &&
      (next.minAmount ?? 0) <= (row.maxAmount ?? Infinity),
  );

async function save(request: Request, current?: Config | null) {
  if (process.env.MOCK_SETELAN_SAVE_ERROR === "500") {
    return failure(500, "Kesalahan server.");
  }

  const parsed = setelanSchema.safeParse(await readBody<unknown>(request));

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    return json({ status: 400, error: issues[0].message, issues }, 400);
  }
  if (current === null) return notFound();

  const body = parsed.data;
  const roleIds = new Set(
    body.tiers.flatMap((tier) =>
      tier.roleUserId === null ? [] : [tier.roleUserId],
    ),
  );

  if ([...roleIds].some((id) => !ROLE_USERS.some((row) => row.id === id))) {
    return failure(404, "Role Penyetuju Tidak Ditemukan");
  }

  const bapelIds = [
    ...body.tiers.map((tier) => tier.bapelId),
    body.bapelId,
  ].filter((id): id is number => id !== null);

  if (bapelIds.some((id) => !bapelOf(id))) {
    return failure(404, "Bapel Tidak Ditemukan");
  }

  const now = new Date().toISOString();
  const id = current?.id ?? nextId++;
  const next: Config = {
    id,
    publicId: current?.publicId ?? crypto.randomUUID(),
    name: body.name,
    documentType: body.documentType,
    bapelId: body.bapelId,
    minAmount: body.minAmount,
    maxAmount: body.maxAmount,
    isActive: body.isActive,
    createdBy: current?.createdBy ?? SESSION_USER_ID,
    createdAt: current?.createdAt ?? now,
    updatedBy: current ? SESSION_USER_ID : null,
    updatedAt: current ? now : null,
    steps: withStepIds(
      body.tiers.map((tier) => ({
        roleUserId: tier.roleUserId,
        roleName:
          tier.roleUserId === null ? (tier.roleName ?? "").trim() : null,
        bapelId: tier.roleUserId === null ? tier.bapelId : null,
      })),
    ),
  };

  if (isOverlap(next)) {
    return failure(
      409,
      "Sudah ada alur persetujuan aktif untuk jenis dokumen dan bapel ini pada rentang nominal yang bertumpang tindih. Rentang mencakup kedua ujungnya, jadi 0–1.000 dan 1.000–2.000 dianggap bertumpang tindih pada nominal 1.000. Ubah rentangnya atau nonaktifkan alur yang lama",
    );
  }

  if (current) configs.splice(configs.indexOf(current), 1, next);
  else configs.push(next);

  const data = toResponse(next);

  return current
    ? json({
        status: 200,
        message: "Berhasil Memperbarui Alur Persetujuan",
        data,
      })
    : json(
        { status: 201, message: "Berhasil Membuat Alur Persetujuan", data },
        201,
      );
}

const JABATAN: Record<number, string[]> = {
  1: ["Ketua", "Sekretaris", "Bendahara", "Penatua"],
  2: ["Ketua", "Wakil Ketua", "Sekretaris", "Bendahara"],
  3: ["Ketua", "sekretaris ", "Bendahara"],
  4: ["Koordinator Sekolah Minggu", "Ketua"],
  5: ["Pemimpin Pujian", "Pemain Keyboard"],
};

function jabatanJemaat(url: URL) {
  const raw = url.searchParams.get("bapelId") ?? "";
  const bapelId = raw === "" ? undefined : Number(raw);

  if (bapelId !== undefined && !(Number.isInteger(bapelId) && bapelId > 0)) {
    return json(
      {
        status: 400,
        error: "Bapel tidak valid",
        issues: [{ path: "bapelId", message: "Bapel tidak valid" }],
      },
      400,
    );
  }

  const names =
    process.env.MOCK_DDL_EMPTY || (bapelId !== undefined && !bapelOf(bapelId))
      ? []
      : bapelId === undefined
        ? BAPEL.flatMap((bapel) => JABATAN[bapel.id] ?? [])
        : (JABATAN[bapelId] ?? []);

  const byKey = new Map<string, string>();
  for (const name of [...names].sort((a, b) => a.localeCompare(b))) {
    const trimmed = name.trim();
    const key = trimmed.toLowerCase();
    if (trimmed && !byKey.has(key)) byKey.set(key, trimmed);
  }

  const data = [...byKey.values()]
    .sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" }))
    .map((name) => ({ name }));

  return data.length === 0
    ? failure(404, "Jabatan Tidak Ditemukan")
    : json({
        status: 200,
        message: "Berhasil Mendapatkan Semua Jabatan",
        data,
      });
}

const ACTION = {
  GET: "VIEW",
  POST: "CREATE",
  PUT: "UPDATE",
  DELETE: "DELETE",
} as const;

const BASE = "/setelan-persetujuan";

export const setelanPersetujuanMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path === "/ddl/jabatan-jemaat") {
    if (method !== "GET") return null;
    if (
      !can(MENU.SETELAN_PERSETUJUAN, "VIEW") &&
      !can(MENU.ROLE_JEMAAT, "VIEW")
    ) {
      return denied();
    }
    return jabatanJemaat(url);
  }

  if (path !== BASE && !path.startsWith(`${BASE}/`)) return null;

  const id = path.slice(BASE.length + 1);
  const action = ACTION[method as keyof typeof ACTION];

  if (
    !action ||
    id.includes("/") ||
    (id === "" && (method === "PUT" || method === "DELETE"))
  ) {
    return null;
  }
  if (id !== "" && method === "POST") return null;
  if (!can(MENU.SETELAN_PERSETUJUAN, action)) return denied();

  if (id === "") {
    if (method === "POST") return save(request);
    if (process.env.MOCK_500) return failure(500, "Kesalahan server.");

    const type = url.searchParams.get("documentType");
    const isActive = url.searchParams.get("isActive");
    const rows = configs
      .filter(
        (row) =>
          !type ||
          !(ALL_TYPES as readonly string[]).includes(type) ||
          row.documentType === type,
      )
      .filter(
        (row) =>
          (isActive !== "true" && isActive !== "false") ||
          row.isActive === (isActive === "true"),
      )
      .sort(byTypeThenId)
      .map(toResponse);

    return list(rows, url, "Alur Persetujuan", "Alur Persetujuan");
  }

  const current = configs.find((row) => row.publicId === id) ?? null;

  if (method === "GET") {
    return current
      ? json({
          status: 200,
          message: "Berhasil Mendapatkan Alur Persetujuan",
          data: toResponse(current),
        })
      : notFound();
  }
  if (method === "PUT") return save(request, current);

  if (process.env.MOCK_SETELAN_SAVE_ERROR === "500") {
    return failure(500, "Kesalahan server.");
  }
  if (!current) return notFound();

  current.isActive = false;
  current.updatedBy = SESSION_USER_ID;
  current.updatedAt = new Date().toISOString();

  return json({
    status: 200,
    message: "Berhasil Menonaktifkan Alur Persetujuan",
  });
};

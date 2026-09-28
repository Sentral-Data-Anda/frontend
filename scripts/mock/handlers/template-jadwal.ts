/**
 * Tiruan `/api/v1/template-pelayan` (be-sada `modules/template_jadwal`, cabang
 * `pelayanan-gaps`). Mengubah larik `TEMPLATE_JADWAL` store; `/ddl/template-jadwal`
 * dijawab `pelayanan-ddl.ts` dari larik yang sama. Slot daftar dan detail
 * dikirim terbalik, supaya pengurutan `order` di FE teruji.
 *
 *   MOCK_EMPTY=1                          → daftar kosong (404)
 *   MOCK_500=1                            → daftar menjawab 500
 *   MOCK_TEMPLATE_JADWAL_SAVE_ERROR=500   → POST/PUT/DELETE menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { denied, json, list, readBody, type MockHandler } from "../kit";
import {
  ROLE_PELAYAN,
  TEMPLATE_JADWAL,
  bapelOf,
  isLive,
  nextId,
  templateCodeOf,
  type TemplateJadwalRow,
  type TemplateSlot,
} from "../pelayanan-store";

type Issue = { path: string; message: string };

type Body = {
  bapelId?: unknown;
  name?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  detail?: unknown;
};

type Parsed = Omit<TemplateJadwalRow, "id" | "code" | "deletedAt">;

const NOT_FOUND = "Template Jadwal Tidak Ditemukan";
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const normalize = (name: string) => name.trim().replace(/\s+/g, " ");

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);

const scrambled = <T>(detail: readonly T[]) => [...detail].reverse();

const roleNameOf = (id: number) =>
  ROLE_PELAYAN.find((role) => role.id === id)?.name ?? "";

const failure = (status: number, error: string, issues?: Issue[]) =>
  json({ status, error, ...(issues ? { issues } : {}) }, status);

const notFound = () => failure(404, NOT_FOUND);

const findRow = (code: string) =>
  TEMPLATE_JADWAL.filter(isLive).find(
    (row) => row.code.toLowerCase() === code.toLowerCase(),
  );

const readTime = (
  value: unknown,
  path: string,
  label: string,
  example: string,
  issues: Issue[],
) => {
  const text = typeof value === "string" ? value : "";

  if (!text) issues.push({ path, message: `Mohon Lengkapi ${label}` });
  else if (!TIME.test(text)) {
    issues.push({
      path,
      message: `Format ${label} harus HH:mm (contoh: ${example})`,
    });
  }

  return text;
};

const readSlots = (value: unknown, issues: Issue[]): TemplateSlot[] => {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push({ path: "detail", message: "Minimal satu dalam Jadwal" });
    return [];
  }

  return value.map(
    (slot: { order?: unknown; rolePelayanId?: unknown }, index) => {
      const rolePelayanId = Number(slot?.rolePelayanId);

      if (!Number.isInteger(rolePelayanId) || rolePelayanId < 1) {
        issues.push({
          path: `detail.${index}.rolePelayanId`,
          message: "Role Pelayan wajib diisi",
        });
      }

      return { order: Number(slot?.order) || index + 1, rolePelayanId };
    },
  );
};

const parse = (body: Body): { issues: Issue[]; value: Parsed } => {
  const issues: Issue[] = [];
  const bapelId = Number(body.bapelId);
  const name = typeof body.name === "string" ? normalize(body.name) : "";

  if (!Number.isInteger(bapelId) || bapelId < 1) {
    issues.push({ path: "bapelId", message: "Mohon lengkapi Bapel ID" });
  }
  if (!name) {
    issues.push({ path: "name", message: "Mohon Lengkapi Nama Jadwal" });
  } else if (name.length < 4) {
    issues.push({
      path: "name",
      message: "Nama Jadwal harus memiliki setidaknya 4 karakter",
    });
  } else if (name.length > 50) {
    issues.push({
      path: "name",
      message: "Nama Jadwal tidak boleh lebih dari 50 karakter",
    });
  }

  const startTime = readTime(
    body.startTime,
    "startTime",
    "Jam Mulai",
    "07:00",
    issues,
  );
  const endTime = readTime(
    body.endTime,
    "endTime",
    "Jam Selesai",
    "09:00",
    issues,
  );

  if (TIME.test(startTime) && TIME.test(endTime) && endTime <= startTime) {
    issues.push({
      path: "endTime",
      message: "Jam Selesai harus setelah Jam Mulai Jadwal",
    });
  }

  const detail = readSlots(body.detail, issues);

  return { issues, value: { bapelId, name, startTime, endTime, detail } };
};

const isNameTaken = (name: string, except?: TemplateJadwalRow) =>
  TEMPLATE_JADWAL.filter(isLive).some(
    (row) => row !== except && row.name.toLowerCase() === name.toLowerCase(),
  );

const checkRelations = (value: Parsed, current?: TemplateJadwalRow) => {
  if (!bapelOf(value.bapelId)) {
    return failure(404, "Bapel Tidak Ditemukan", [
      { path: "bapelId", message: "Bapel Tidak Ditemukan" },
    ]);
  }

  const isRenamed =
    !current || current.name.toLowerCase() !== value.name.toLowerCase();

  if (isRenamed && isNameTaken(value.name, current)) {
    return failure(409, "Nama Template Sudah Tersedia", [
      { path: "name", message: "Nama Template Sudah Tersedia" },
    ]);
  }

  const missing = value.detail.findIndex(
    (slot) =>
      !ROLE_PELAYAN.some(
        (role) => role.id === slot.rolePelayanId && isLive(role),
      ),
  );

  if (missing >= 0) {
    return failure(404, "Role Pelayan Tidak Ditemukan", [
      {
        path: `detail.${missing}.rolePelayanId`,
        message: "Role Pelayan Tidak Ditemukan",
      },
    ]);
  }

  return null;
};

const toListRow = (row: TemplateJadwalRow) => ({
  code: row.code,
  name: row.name,
  startTime: row.startTime,
  endTime: row.endTime,
  bapel: bapelOf(row.bapelId)?.name ?? "",
  detail: scrambled(row.detail).map((slot) => ({
    order: slot.order,
    roleName: roleNameOf(slot.rolePelayanId),
  })),
});

const toDetail = (row: TemplateJadwalRow) => ({
  id: row.id,
  publicId: `template-jadwal-${row.id}`,
  code: row.code,
  name: row.name,
  startTime: row.startTime,
  endTime: row.endTime,
  bapel: bapelOf(row.bapelId),
  detail: scrambled(row.detail),
});

const toRaw = (row: TemplateJadwalRow) => ({
  id: row.id,
  publicId: `template-jadwal-${row.id}`,
  code: row.code,
  name: row.name,
  startTime: row.startTime,
  endTime: row.endTime,
  bapelId: row.bapelId,
});

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

export const templateJadwalMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/template-pelayan" && !path.startsWith("/template-pelayan/")) {
    return null;
  }

  const code = path.match(/^\/template-pelayan\/([^/]+)$/)?.[1];

  if (!can(MENU.TEMPLATE_JADWAL, actionOf(method))) return denied();

  if (
    method !== "GET" &&
    process.env.MOCK_TEMPLATE_JADWAL_SAVE_ERROR === "500"
  ) {
    return failure(500, "Kesalahan server.");
  }

  if (path === "/template-pelayan" && method === "GET") {
    if (process.env.MOCK_500) return failure(500, "Kesalahan server.");

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const bapelId = Number(url.searchParams.get("bapelId")) || null;

    return list(
      TEMPLATE_JADWAL.filter(isLive)
        .filter(
          (row) =>
            row.name.toLowerCase().includes(filter) ||
            row.code.toLowerCase().includes(filter),
        )
        .filter((row) => bapelId === null || row.bapelId === bapelId)
        .sort(byName)
        .map(toListRow),
      url,
      "Template Jadwal",
      "Template Jadwal",
    );
  }

  if (path === "/template-pelayan" && method === "POST") {
    const { issues, value } = parse(await readBody<Body>(request));
    if (issues.length) return failure(400, issues[0].message, issues);

    const rejected = checkRelations(value);
    if (rejected) return rejected;

    const row: TemplateJadwalRow = {
      id: nextId(TEMPLATE_JADWAL),
      code: templateCodeOf(value.bapelId),
      ...value,
      deletedAt: null,
    };
    TEMPLATE_JADWAL.push(row);

    return json(
      {
        status: 201,
        message: "Berhasil Membuat Template Jadwal Pelayan",
        data: toRaw(row),
      },
      201,
    );
  }

  if (!code) return null;

  if (method === "PUT") {
    const { issues, value } = parse(await readBody<Body>(request));
    if (issues.length) return failure(400, issues[0].message, issues);

    const row = findRow(code);
    if (!row) return notFound();

    const rejected = checkRelations(value, row);
    if (rejected) return rejected;

    Object.assign(row, value);

    return json({
      status: 200,
      message: "Berhasil Memperbarui Template Jadwal Pelayan",
      data: toRaw(row),
    });
  }

  const row = findRow(code);
  if (!row) return notFound();

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Template Jadwal",
      data: toDetail(row),
    });
  }

  if (method === "DELETE") {
    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Template Jadwal",
      data: toRaw(row),
    });
  }

  return null;
};

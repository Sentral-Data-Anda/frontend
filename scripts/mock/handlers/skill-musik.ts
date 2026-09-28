/**
 * Tiruan `/api/v1/musik-skill` (be-sada `modules/musik_skill`) atas larik
 * `MUSIK_SKILL` store; `/ddl/skill-music` dijawab `pelayanan-ddl.ts`.
 *
 *   MOCK_EMPTY=1                      → daftar kosong (404)
 *   MOCK_500=1                        → daftar menjawab 500
 *   MOCK_SKILL_MUSIK_SAVE_ERROR=500   → POST/PUT/DELETE menjawab 500
 *
 * Seed 1–4 dipakai pelayan/jadwal (hapus 400); 5 Biola tidak dipakai.
 */
import { MENU } from "../../../src/config/menu";
import { todayJakarta } from "../../../src/lib/date";
import { denied, json, list, readBody, type MockHandler } from "../kit";
import {
  GROUP_PELAYAN,
  isLive,
  JADWAL_PELAYAN,
  MUSIK_SKILL,
  nextId,
  PELAYAN,
  type MusikSkillRow,
} from "../pelayanan-store";

const NOT_FOUND = "Skill Musik Tidak Ditemukan";
const IN_USE = "Skill Musik Tidak Dapat Dihapus Karena Masih Digunakan oleh";

const normalize = (name: string) => name.trim().replace(/\s+/g, " ");

const toRow = ({ id, name }: MusikSkillRow) => ({
  id,
  publicId: `musik-skill-${id}`,
  name,
});

const byName = (a: MusikSkillRow, b: MusikSkillRow) =>
  a.name.localeCompare(b.name);

const liveRows = () => MUSIK_SKILL.filter(isLive);

const findRow = (id: string) => liveRows().find((row) => String(row.id) === id);

const notFound = () => json({ status: 404, error: NOT_FOUND }, 404);

const nameErrorOf = (name: string | null) => {
  if (name === null) return "Mohon Lengkapi Nama Skill Musik";
  if (name.length < 2) {
    return "Nama Skill Musik harus memiliki setidaknya 2 karakter";
  }
  if (name.length > 50) {
    return "Nama Skill Musik tidak boleh lebih dari 50 karakter";
  }

  return null;
};

const parse = (body: { name?: unknown }) => {
  const name = typeof body.name === "string" ? normalize(body.name) : null;
  const error = nameErrorOf(name);

  if (error !== null || name === null) {
    return {
      failure: json(
        { status: 400, error, issues: [{ path: "name", message: error }] },
        400,
      ),
    };
  }

  return { name };
};

const isNameTaken = (name: string) =>
  liveRows().some((row) => row.name.toLowerCase() === name.toLowerCase());

const TAKEN = "Skill Musik Sudah Tersedia";

const taken = () =>
  json(
    { status: 409, error: TAKEN, issues: [{ path: "name", message: TAKEN }] },
    409,
  );

const usageOf = (id: number) => {
  const today = todayJakarta();

  if (
    PELAYAN.some((row) => isLive(row) && row.skillIds.includes(id)) ||
    GROUP_PELAYAN.some((row) => isLive(row) && row.skillIds.includes(id))
  ) {
    return "Pelayan";
  }
  if (
    JADWAL_PELAYAN.some(
      (row) =>
        isLive(row) &&
        row.date >= today &&
        row.detail.some((slot) => slot.musikSkillId === id),
    )
  ) {
    return "Jadwal Pelayan";
  }

  return null;
};

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

export const skillMusikMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/musik-skill" && !path.startsWith("/musik-skill/")) {
    return null;
  }

  const id = path.match(/^\/musik-skill\/([^/]+)$/)?.[1];

  if (!can(MENU.SKILL_MUSIK, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_SKILL_MUSIK_SAVE_ERROR === "500") {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/musik-skill" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

    return list(
      liveRows()
        .filter((row) => row.name.toLowerCase().includes(filter))
        .sort(byName)
        .map(toRow),
      url,
      "Skill Musik",
      "Skill Musik",
    );
  }

  if (path === "/musik-skill" && method === "POST") {
    const parsed = parse(await readBody(request));
    if (parsed.failure) return parsed.failure;
    if (isNameTaken(parsed.name)) return taken();

    const row = { id: nextId(MUSIK_SKILL), name: parsed.name, deletedAt: null };
    MUSIK_SKILL.push(row);

    return json(
      {
        status: 201,
        message: "Berhasil Membuat Skill Musik",
        data: toRow(row),
      },
      201,
    );
  }

  if (!id) return null;

  if (method === "PUT") {
    const parsed = parse(await readBody(request));
    if (parsed.failure) return parsed.failure;

    const row = findRow(id);
    if (!row) return notFound();

    const isRenamed = parsed.name.toLowerCase() !== row.name.toLowerCase();
    if (isRenamed && isNameTaken(parsed.name)) return taken();

    row.name = parsed.name;

    return json({
      status: 200,
      message: "Berhasil Memperbarui Skill Musik",
      data: toRow(row),
    });
  }

  const row = findRow(id);
  if (!row) return notFound();

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Skill Musik",
      data: toRow(row),
    });
  }

  if (method === "DELETE") {
    const usage = usageOf(row.id);
    if (usage) return json({ status: 400, error: `${IN_USE} ${usage}` }, 400);

    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Skill Musik",
      data: toRow(row),
    });
  }

  return null;
};

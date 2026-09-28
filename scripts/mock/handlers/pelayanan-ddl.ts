/**
 * Tiruan `/ddl/role-pelayan`, `/ddl/skill-music`, `/ddl/template-jadwal` dari
 * `pelayanan-store.ts`, dengan guard dan bentuk sesudah gap be-sada B1 dan B2
 * (docs/design/pelayanan/README.md §7). Milik TL: dipakai lintas agent, jadi
 * perubahan di Role Pelayan, Skill Musik, dan Template langsung terlihat di form
 * Pelayan dan Jadwal. `/ddl/pelayan` dan `/ddl/jadwal-pelayan` milik handler
 * `jadwal-pelayan.ts`.
 *
 *   MOCK_DDL_EMPTY=1 → ketiganya 404, sama dengan ddl lain
 */
import { MENU, type MenuSlug } from "../../../src/config/menu";
import { denied, json, type MockHandler } from "../kit";
import {
  isLive,
  MUSIK_SKILL,
  ROLE_PELAYAN,
  TEMPLATE_JADWAL,
} from "../pelayanan-store";

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);

const GUARDS: Record<string, MenuSlug[]> = {
  "/ddl/role-pelayan": [
    MENU.ROLE_PELAYAN,
    MENU.JADWAL_PELAYAN,
    MENU.TEMPLATE_JADWAL,
    MENU.DAFTAR_PELAYAN,
  ],
  "/ddl/skill-music": [
    MENU.SKILL_MUSIK,
    MENU.DAFTAR_PELAYAN,
    MENU.JADWAL_PELAYAN,
  ],
  "/ddl/template-jadwal": [MENU.TEMPLATE_JADWAL, MENU.JADWAL_PELAYAN],
};

const NAMES: Record<string, string> = {
  "/ddl/role-pelayan": "Role Pelayan",
  "/ddl/skill-music": "Skill Musik",
  "/ddl/template-jadwal": "Template Jadwal",
};

const rowsOf = (path: string, url: URL): unknown[] => {
  if (path === "/ddl/role-pelayan" || path === "/ddl/skill-music") {
    const source = path === "/ddl/role-pelayan" ? ROLE_PELAYAN : MUSIK_SKILL;

    return source
      .filter(isLive)
      .sort(byName)
      .map(({ id, name }) => ({ id, name }));
  }

  const bapelId = Number(url.searchParams.get("bapelId")) || null;

  return TEMPLATE_JADWAL.filter(isLive)
    .filter((row) => bapelId === null || row.bapelId === bapelId)
    .sort(byName)
    .map(({ id, code, name, startTime, endTime, detail }) => ({
      id,
      code,
      name,
      startTime,
      endTime,
      detail: [...detail].sort((a, b) => a.order - b.order),
    }));
};

export const pelayananDdlMock: MockHandler = ({ url, path, method, can }) => {
  const guard = GUARDS[path];

  if (!guard || method !== "GET") return null;
  if (!guard.some((menu) => can(menu, "VIEW"))) return denied();

  const rows = process.env.MOCK_DDL_EMPTY ? [] : rowsOf(path, url);

  if (rows.length === 0) {
    return json({ status: 404, error: `${NAMES[path]} Tidak Ditemukan` }, 404);
  }

  return json({
    status: 200,
    message: `Berhasil Mendapatkan Semua ${NAMES[path]}`,
    data: rows,
  });
};

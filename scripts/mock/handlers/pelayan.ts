/**
 * Tiruan `/api/v1/pelayan` (be-sada `modules/pelayan`, cabang `pelayanan-gaps`):
 * perorangan (`PELAYAN`) dan kelompok (`GROUP_PELAYAN`) di pelayanan-store.
 *
 *   MOCK_EMPTY=1                  → daftar pelayan kosong (404)
 *   MOCK_500=1                    → daftar pelayan menjawab 500
 *   MOCK_PELAYAN_SAVE_ERROR=500   → POST/PUT/DELETE menjawab 500
 *
 * Bethari (PLYN_0001-0002) terjadwal Minggu depan: hapus 400, nonaktifkan →
 * `futureSlots`. Debora (PLYN_0001-0004) tidak terjadwal: hapus berhasil.
 */
import { MENU } from "../../../src/config/menu";
import { todayJakarta } from "../../../src/lib/date";
import { formatDate } from "../../../src/lib/format";
import { denied, json, list, readBody, type MockHandler } from "../kit";
import {
  bapelOf,
  GROUP_PELAYAN,
  groupCodeOf,
  isLive,
  JADWAL_PELAYAN,
  jemaatOf,
  MUSIK_SKILL,
  nextId,
  PELAYAN,
  pelayanCodeOf,
  ROLE_PELAYAN,
  type GroupPelayanRow,
  type PelayanRow,
} from "../pelayanan-store";

type Body = {
  typePelayan?: unknown;
  bapelId?: unknown;
  jemaatId?: unknown;
  name?: unknown;
  phone?: unknown;
  members?: unknown;
  rolePelayan?: unknown;
  isPemusik?: unknown;
  musikSkill?: unknown;
  status?: unknown;
};

type Input = {
  typePelayan: "INDIVIDUAL" | "GROUP";
  bapelId: number;
  jemaatId: number;
  name: string;
  phone: string;
  members: number[];
  rolePelayan: number[];
  musikSkill: number[];
  status: boolean;
};

type Issue = { path: string; message: string };

const NOT_FOUND = "Pelayan Tidak Ditemukan";

const fail = (status: number, issues: Issue[]) =>
  json({ status, error: issues[0].message, issues }, status);

const failAt = (status: number, path: string, message: string) =>
  fail(status, [{ path, message }]);

const notFound = () => json({ status: 404, error: NOT_FOUND }, 404);

const ids = (value: unknown): number[] =>
  Array.isArray(value) ? value.map(Number).filter(Number.isInteger) : [];

const text = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const nameOfRole = (id: number) =>
  ROLE_PELAYAN.find((row) => row.id === id)?.name ?? "";

const nameOfSkill = (id: number) =>
  MUSIK_SKILL.find((row) => row.id === id)?.name ?? "";

const jemaatName = (id: number) => jemaatOf(id)?.name ?? "";

const isGroupCode = (code: string) => /^gplyn_/i.test(code);

const sameCode = (code: string) => (row: { code: string }) =>
  row.code.toLowerCase() === code.toLowerCase();

const findLive = (code: string) =>
  isGroupCode(code)
    ? GROUP_PELAYAN.filter(isLive).find(sameCode(code))
    : PELAYAN.filter(isLive).find(sameCode(code));

const isGroupRow = (
  row: PelayanRow | GroupPelayanRow,
): row is GroupPelayanRow => "memberIds" in row;

const toListItem = (row: PelayanRow | GroupPelayanRow) =>
  isGroupRow(row)
    ? {
        code: row.code,
        typePelayan: "GROUP",
        namePelayan: row.name,
        genderPelayan: null,
        bapel: bapelOf(row.bapelId)?.name ?? "",
        role: [nameOfRole(row.rolePelayanId)],
        members: row.memberIds.map(jemaatName),
        musikSkill: row.skillIds.map(nameOfSkill),
        status: row.status,
      }
    : {
        code: row.code,
        typePelayan: "INDIVIDUAL",
        namePelayan: jemaatName(row.jemaatId),
        genderPelayan: null,
        bapel: bapelOf(row.bapelId)?.name ?? "",
        role: row.roleIds.map(nameOfRole),
        members: [],
        musikSkill: row.skillIds.map(nameOfSkill),
        status: row.status,
      };

const jemaatRef = (id: number) => {
  const jemaat = jemaatOf(id);

  return jemaat
    ? { id: jemaat.id, code: jemaat.code, name: jemaat.name }
    : null;
};

const toDetail = (row: PelayanRow | GroupPelayanRow) =>
  isGroupRow(row)
    ? {
        code: row.code,
        typePelayan: "GROUP",
        jemaatId: null,
        name: row.name,
        phone: row.phone,
        bapelId: String(row.bapelId),
        rolePelayan: [String(row.rolePelayanId)],
        members: row.memberIds.map(String),
        musikSkill: row.skillIds.map(String),
        status: row.status,
        jemaat: null,
        memberList: row.memberIds
          .map(jemaatRef)
          .filter((member) => member !== null)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }
    : {
        code: row.code,
        typePelayan: "INDIVIDUAL",
        jemaatId: String(row.jemaatId),
        name: null,
        phone: null,
        bapelId: String(row.bapelId),
        rolePelayan: row.roleIds.map(String),
        members: [],
        musikSkill: row.skillIds.map(String),
        status: row.status,
        jemaat: jemaatRef(row.jemaatId),
        memberList: [],
      };

const futureSlotsOf = (row: PelayanRow | GroupPelayanRow) => {
  const today = todayJakarta();
  const isGroup = isGroupRow(row);

  return JADWAL_PELAYAN.filter(isLive)
    .filter((jadwal) => jadwal.date >= today)
    .filter((jadwal) =>
      jadwal.detail.some((slot) =>
        isGroup ? slot.groupPelayanId === row.id : slot.pelayanId === row.id,
      ),
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    )
    .map((jadwal) => ({
      code: jadwal.code,
      name: jadwal.name,
      date: jadwal.date,
      startTime: jadwal.startTime,
      endTime: jadwal.endTime,
      bapel: { name: bapelOf(jadwal.bapelId)?.name ?? "" },
    }));
};

const parse = (body: Body): { issues: Issue[]; value: Input } => {
  const issues: Issue[] = [];
  const typePelayan = body.typePelayan;
  const isGroup = typePelayan === "GROUP";
  const rolePelayan = ids(body.rolePelayan);
  const members = ids(body.members);
  const musikSkill = ids(body.musikSkill);
  const name = text(body.name);
  const phone = typeof body.phone === "string" ? body.phone : "";
  const bapelId = Number(body.bapelId);
  const jemaatId = Number(body.jemaatId);

  if (!Number.isInteger(bapelId) || bapelId < 1) {
    issues.push({ path: "bapelId", message: "Mohon lengkapi Bapel Pelayan" });
  }
  if (typePelayan !== "INDIVIDUAL" && typePelayan !== "GROUP") {
    issues.push({
      path: "typePelayan",
      message: "Tipe Pelayan harus bernilai INDIVIDUAL atau GROUP",
    });
  }
  if (rolePelayan.length === 0) {
    issues.push({
      path: "rolePelayan",
      message: "Minimal pilih satu Role Pelayan",
    });
  }
  if (typePelayan === "INDIVIDUAL" && !(jemaatId > 0)) {
    issues.push({ path: "jemaatId", message: "Mohon lengkapi ID Jemaat" });
  }
  if (isGroup && rolePelayan.length > 1) {
    issues.push({
      path: "rolePelayan",
      message: "Group Pelayan hanya dapat memiliki satu Role Pelayan",
    });
  }
  if (isGroup && !name) {
    issues.push({ path: "name", message: "Nama Group wajib diisi" });
  } else if (isGroup && name.length > 50) {
    issues.push({
      path: "name",
      message: "Nama tidak boleh lebih dari 50 karakter",
    });
  }
  if (isGroup && !phone) {
    issues.push({ path: "phone", message: "No Handphone wajib diisi" });
  } else if (isGroup && !/^\d+$/.test(phone)) {
    issues.push({ path: "phone", message: "No Handphone hanya boleh angka" });
  } else if (isGroup && phone.length > 12) {
    issues.push({
      path: "phone",
      message: "No Handphone tidak boleh lebih dari 12 angka",
    });
  }
  if (isGroup && members.length === 0) {
    issues.push({
      path: "members",
      message: "Minimal harus ada satu anggota dalam group",
    });
  }
  if (isGroup && body.isPemusik === true && musikSkill.length === 0) {
    issues.push({
      path: "musikSkill",
      message: "Minimal harus memilih satu Skill Musik",
    });
  }

  return {
    issues,
    value: {
      typePelayan: isGroup ? "GROUP" : "INDIVIDUAL",
      bapelId,
      jemaatId,
      name,
      phone,
      members,
      rolePelayan,
      musikSkill: body.isPemusik === true ? musikSkill : [],
      status: body.status !== false,
    },
  };
};

const isRoleLive = (id: number) =>
  ROLE_PELAYAN.some((row) => row.id === id && isLive(row));

const isSkillLive = (id: number) =>
  MUSIK_SKILL.some((row) => row.id === id && isLive(row));

const isRegistered = (jemaatId: number, bapelId: number, except?: number) =>
  PELAYAN.some(
    (row) =>
      isLive(row) &&
      row.jemaatId === jemaatId &&
      row.bapelId === bapelId &&
      row.id !== except,
  );

const isGroupNameTaken = (name: string, except?: number) =>
  GROUP_PELAYAN.some(
    (row) =>
      isLive(row) &&
      row.id !== except &&
      row.name.toLowerCase() === name.toLowerCase(),
  );

const checkRelations = (input: Input, saved?: PelayanRow | GroupPelayanRow) => {
  const bapel = bapelOf(input.bapelId);

  if (!bapel) return failAt(404, "bapelId", "Bapel Tidak Ditemukan");

  const missingRole = input.rolePelayan.find((id) => !isRoleLive(id));

  if (missingRole !== undefined) {
    return failAt(
      404,
      "rolePelayan",
      `Role Pelayan dengan ID ${missingRole} Tidak Ditemukan`,
    );
  }

  if (input.typePelayan === "INDIVIDUAL") {
    const jemaatId =
      saved && !isGroupRow(saved) ? saved.jemaatId : input.jemaatId;
    const isBapelChanged = !saved || saved.bapelId !== input.bapelId;

    if (!jemaatOf(jemaatId)) {
      return failAt(404, "jemaatId", "Jemaat Tidak Ditemukan");
    }
    if (isBapelChanged && isRegistered(jemaatId, input.bapelId, saved?.id)) {
      return failAt(
        400,
        saved ? "bapelId" : "jemaatId",
        `Jemaat Tersebut Sudah Terdaftar Sebagai Pelayan di ${bapel.name}`,
      );
    }
  } else {
    if (isGroupNameTaken(input.name, saved?.id)) {
      return failAt(400, "name", "Nama Group Tersebut Sudah Tersedia");
    }

    const missingMember = input.members.find((id) => !jemaatOf(id));

    if (missingMember !== undefined) {
      return failAt(
        404,
        "members",
        `Anggota Group dengan Jemaat ID ${missingMember} Tidak Ditemukan`,
      );
    }
  }

  const missingSkill = input.musikSkill.find((id) => !isSkillLive(id));

  if (missingSkill !== undefined) {
    return failAt(
      404,
      "musikSkill",
      `Skill Musik dengan ID ${missingSkill} Tidak Ditemukan`,
    );
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

const matches = (row: PelayanRow | GroupPelayanRow, url: URL) => {
  const item = toListItem(row);
  const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
  const bapelId = Number(url.searchParams.get("bapelId")) || null;
  const roleId = Number(url.searchParams.get("roleId")) || null;
  const status = url.searchParams.get("status");
  const haystack = [
    item.code,
    item.namePelayan,
    item.bapel,
    isGroupRow(row) ? row.phone : "",
  ].map((value) => value.toLowerCase());
  const roleIds = isGroupRow(row) ? [row.rolePelayanId] : row.roleIds;

  return (
    (!filter || haystack.some((value) => value.includes(filter))) &&
    (bapelId === null || row.bapelId === bapelId) &&
    (roleId === null || roleIds.includes(roleId)) &&
    (!status || row.status === (status === "true"))
  );
};

export const pelayanMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/pelayan" && !path.startsWith("/pelayan/")) return null;

  const code = path.match(/^\/pelayan\/([^/]+)$/)?.[1];

  if (!can(MENU.DAFTAR_PELAYAN, actionOf(method))) return denied();

  if (method !== "GET" && process.env.MOCK_PELAYAN_SAVE_ERROR === "500") {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/pelayan" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const rows = [...PELAYAN.filter(isLive), ...GROUP_PELAYAN.filter(isLive)]
      .filter((row) => matches(row, url))
      .map(toListItem)
      .sort((a, b) => a.namePelayan.localeCompare(b.namePelayan));

    return list(rows, url, "Pelayan", "Pelayan");
  }

  if (path === "/pelayan" && method === "POST") {
    const { issues, value } = parse(await readBody<Body>(request));

    if (issues.length) return fail(400, issues);

    const failure = checkRelations(value);

    if (failure) return failure;

    const row =
      value.typePelayan === "GROUP"
        ? {
            id: nextId(GROUP_PELAYAN),
            code: groupCodeOf(value.bapelId),
            name: value.name,
            phone: value.phone,
            bapelId: value.bapelId,
            rolePelayanId: value.rolePelayan[0],
            skillIds: value.musikSkill,
            memberIds: value.members,
            status: value.status,
            deletedAt: null,
          }
        : {
            id: nextId(PELAYAN),
            code: pelayanCodeOf(value.bapelId),
            jemaatId: value.jemaatId,
            bapelId: value.bapelId,
            roleIds: value.rolePelayan,
            skillIds: value.musikSkill,
            status: value.status,
            deletedAt: null,
          };

    if (isGroupRow(row)) GROUP_PELAYAN.push(row);
    else PELAYAN.push(row);

    return json(
      { status: 201, message: "Berhasil Membuat Pelayan", data: row },
      201,
    );
  }

  if (!code) return null;

  if (method === "PUT") {
    const { issues, value } = parse(await readBody<Body>(request));

    if (issues.length) return fail(400, issues);

    const saved = findLive(code);

    if (!saved || isGroupRow(saved) !== (value.typePelayan === "GROUP")) {
      return notFound();
    }

    const failure = checkRelations(value, saved);

    if (failure) return failure;

    saved.bapelId = value.bapelId;
    saved.skillIds = value.musikSkill;
    saved.status = value.status;

    if (isGroupRow(saved)) {
      saved.name = value.name;
      saved.phone = value.phone;
      saved.rolePelayanId = value.rolePelayan[0];
      saved.memberIds = value.members;
    } else {
      saved.roleIds = value.rolePelayan;
    }

    return json({
      status: 200,
      message: "Berhasil Memperbarui Pelayan",
      data: saved,
      futureSlots: saved.status ? [] : futureSlotsOf(saved),
    });
  }

  const row = findLive(code);

  if (!row) return notFound();

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Pelayan",
      data: toDetail(row),
    });
  }

  if (method === "DELETE") {
    const [next] = futureSlotsOf(row);

    if (next) {
      return json(
        {
          status: 400,
          error: `Pelayan Tidak Dapat Dihapus Karena Masih Terjadwal pada ${formatDate(next.date)}. Nonaktifkan Pelayan Ini Jika Tidak Ingin Dipakai Lagi`,
        },
        400,
      );
    }

    row.deletedAt = new Date().toISOString();
    row.status = false;

    return json({
      status: 200,
      message: "Berhasil Menghapus Pelayan",
      data: row,
    });
  }

  return null;
};

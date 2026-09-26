/**
 * Tiruan be-sada `POST /profession` dan `POST /ethnic-group`, serta `GET /ddl/profession` dan
 * `/ddl/ethnic-group` dari state yang sama, supaya tambahan langsung muncul
 * (docs/design/kejemaatan/master-tambah-baru.md).
 *
 *   MOCK_MASTER_SAVE_ERROR=500 → tambah pekerjaan/suku menjawab 500
 *
 * Nama yang sudah ada tanpa peka huruf besar menjawab 200 "Sudah Ada" dengan baris lamanya.
 */
import { MENU } from "../../../src/config/menu";
import { normalizeName } from "../../../src/lib/name";
import { ETHNIC_GROUPS, PROFESSIONS } from "../../mock-dashboard";
import { denied, json, readBody, type MockHandler } from "../kit";

type MasterRow = { id: number; code: string; name: string };

const rowsOf = (names: string[], prefix: string): MasterRow[] =>
  names.map((name, index) => ({
    id: index + 1,
    code: `${prefix}-${index + 1}`,
    name,
  }));

const MASTERS = {
  profession: {
    noun: "Pekerjaan",
    codePrefix: "PFS",
    rows: rowsOf(PROFESSIONS, "PRF"),
  },
  "ethnic-group": {
    noun: "Suku",
    codePrefix: "EG",
    rows: rowsOf(ETHNIC_GROUPS, "ETH"),
  },
};

type MasterKind = keyof typeof MASTERS;

const isMasterKind = (kind: string): kind is MasterKind =>
  Object.hasOwn(MASTERS, kind);

const invalid = (message: string) =>
  json(
    { status: 400, error: message, issues: [{ path: "name", message }] },
    400,
  );

const create = async (kind: MasterKind, request: Request) => {
  const master = MASTERS[kind];
  const body = await readBody<{ name?: unknown }>(request);
  const name = normalizeName(typeof body.name === "string" ? body.name : "");

  if (!name) return invalid(`Mohon Lengkapi Nama ${master.noun}`);
  if (name.length < 2) {
    return invalid(`Nama ${master.noun} minimal 2 karakter`);
  }
  if (name.length > 50) {
    return invalid(`Nama ${master.noun} tidak boleh lebih dari 50 karakter`);
  }

  const existing = master.rows.find(
    (row) => row.name.toLowerCase() === name.toLowerCase(),
  );

  if (existing) {
    return json({
      status: 200,
      message: `${master.noun} Sudah Ada`,
      data: existing,
    });
  }

  const id = master.rows.length + 1;
  const row = {
    id,
    code: `${master.codePrefix}-${String(id).padStart(4, "0")}`,
    name,
  };

  master.rows.push(row);

  return json(
    { status: 201, message: `Berhasil Menambah ${master.noun}`, data: row },
    201,
  );
};

export const masterJemaatMock: MockHandler = ({
  path,
  method,
  request,
  can,
}) => {
  const ddl = path.match(/^\/ddl\/([^/]+)$/)?.[1] ?? "";

  if (method === "GET" && isMasterKind(ddl)) {
    if (process.env.MOCK_DDL_EMPTY) {
      return json({ status: 404, error: "Data Tidak Ditemukan" }, 404);
    }

    const rows = [...MASTERS[ddl].rows].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    return json({
      status: 200,
      message: "Berhasil Mendapatkan Data",
      data: rows,
    });
  }

  const kind = path.slice(1);

  if (method !== "POST" || !isMasterKind(kind)) return null;
  if (!can(MENU.DAFTAR_JEMAAT, "CREATE")) return denied();
  if (process.env.MOCK_MASTER_SAVE_ERROR === "500") {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  return create(kind, request);
};

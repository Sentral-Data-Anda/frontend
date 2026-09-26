/**
 * Tiruan `/api/v1/zone-church` (be-sada `modules/zone_church`) dan
 * `GET /ddl/zone-church` dari state yang sama, supaya menonaktifkan wilayah
 * langsung terlihat di form keluarga dan jemaat.
 *
 *   MOCK_500=1                    → daftar wilayah menjawab 500
 *   MOCK_WILAYAH_MANY=1           → 45 wilayah (5 halaman)
 *   MOCK_WILAYAH_SAVE_ERROR=500   → simpan (POST/PUT) menjawab 500
 *   MOCK_DDL_EMPTY=1              → ddl kosong (404), sama dengan ddl lain
 *
 * Nama ganda (tanpa peka huruf besar) → 409 "Wilayah Sudah Tersedia".
 * ZC-0001 masih dipakai keluarga, jadi hapusnya 400. ZC-0005 nonaktif.
 */
import { MENU } from "../../../src/config/menu";
import { ZONE_CHURCHES } from "../../mock-dashboard";
import { denied, json, list, readBody, type MockHandler } from "../kit";

type Row = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedBy: number | null;
  updatedAt: string;
  blockers: string;
};

type Body = { name?: unknown; isActive?: unknown };

const SEEDED_AT = "2026-01-05T02:00:00.000Z";

const toRow = (id: number, name: string, isActive = true): Row => ({
  id,
  publicId: `zone-church-${id}`,
  code: `ZC-${String(id).padStart(4, "0")}`,
  name,
  isActive,
  createdBy: 1,
  createdAt: SEEDED_AT,
  updatedBy: null,
  updatedAt: SEEDED_AT,
  blockers: "",
});

const rows: Row[] = process.env.MOCK_WILAYAH_MANY
  ? Array.from({ length: 45 }, (_, index) =>
      toRow(index + 1, `Wilayah ${index + 1}`, index % 7 !== 6),
    )
  : [
      ...ZONE_CHURCHES.map((name, index) => toRow(index + 1, name)),
      toRow(ZONE_CHURCHES.length + 1, "Wilayah V", false),
    ];

rows[0].blockers = "Keluarga";

const view = ({ blockers: _blockers, ...row }: Row) => row;

const normalize = (name: string) => name.trim().replace(/\s+/g, " ");

const findRow = (code: string) =>
  rows.find((row) => row.code.toLowerCase() === code.toLowerCase());

const invalid = (path: string, message: string) =>
  json({ status: 400, error: message, issues: [{ path, message }] }, 400);

const validate = (body: Body) => {
  const name = typeof body.name === "string" ? normalize(body.name) : "";

  if (!name) return invalid("name", "Mohon Lengkapi Nama Wilayah");
  if (name.length > 50) {
    return invalid("name", "Nama Wilayah tidak boleh lebih dari 50 karakter");
  }
  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    return invalid("isActive", "Status Wilayah tidak valid");
  }

  return null;
};

const isNameTaken = (name: string, ownId?: number) =>
  rows.some(
    (row) =>
      row.name.toLowerCase() === normalize(name).toLowerCase() &&
      row.id !== ownId,
  );

const taken = () => json({ status: 409, error: "Wilayah Sudah Tersedia" }, 409);

const ddl = () => {
  if (process.env.MOCK_DDL_EMPTY || rows.length === 0) {
    return json({ status: 404, error: "Data Tidak Ditemukan" }, 404);
  }

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Data",
    data: [...rows]
      .sort((a, b) => a.id - b.id)
      .map(({ id, code, name, isActive }) => ({ id, code, name, isActive })),
  });
};

export const wilayahMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path === "/ddl/zone-church" && method === "GET") return ddl();
  if (path !== "/zone-church" && !path.startsWith("/zone-church/")) {
    return null;
  }

  const code = path.match(/^\/zone-church\/([^/]+)$/)?.[1];
  const action =
    method === "POST"
      ? "CREATE"
      : method === "PUT"
        ? "UPDATE"
        : method === "DELETE"
          ? "DELETE"
          : "VIEW";

  if (!can(MENU.WILAYAH, action)) return denied();

  if (
    (method === "POST" || method === "PUT") &&
    process.env.MOCK_WILAYAH_SAVE_ERROR === "500"
  ) {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/zone-church" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const isActive = url.searchParams.get("isActive");

    return list(
      rows
        .filter(
          (row) =>
            row.name.toLowerCase().includes(filter) ||
            row.code.toLowerCase().includes(filter),
        )
        .filter(
          (row) =>
            (isActive !== "true" && isActive !== "false") ||
            row.isActive === (isActive === "true"),
        )
        .sort((a, b) => a.code.localeCompare(b.code))
        .map(view),
      url,
      "Wilayah",
      "Wilayah",
    );
  }

  if (path === "/zone-church" && method === "POST") {
    const body = await readBody<Body>(request);
    const failure = validate(body);
    if (failure) return failure;

    const name = normalize(String(body.name));
    if (isNameTaken(name)) return taken();

    const row = toRow(
      Math.max(0, ...rows.map((item) => item.id)) + 1,
      name,
      body.isActive !== false,
    );
    row.createdAt = new Date().toISOString();
    row.updatedAt = row.createdAt;
    rows.push(row);

    return json(
      { status: 201, message: "Berhasil Membuat Wilayah", data: view(row) },
      201,
    );
  }

  const row = code ? findRow(code) : undefined;

  if (!row) return json({ status: 404, error: "Wilayah Tidak Ditemukan" }, 404);

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Wilayah",
      data: view(row),
    });
  }

  if (method === "PUT") {
    const body = await readBody<Body>(request);
    const failure = validate(body);
    if (failure) return failure;

    const name = normalize(String(body.name));
    const isRenamed = name.toLowerCase() !== row.name.toLowerCase();
    if (isRenamed && isNameTaken(name, row.id)) return taken();

    row.name = name;
    row.isActive = body.isActive !== false;
    row.updatedBy = 1;
    row.updatedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Memperbarui Wilayah",
      data: view(row),
    });
  }

  if (method === "DELETE") {
    if (row.blockers) {
      return json(
        {
          status: 400,
          error: `Wilayah Tidak Dapat Dihapus Karena Masih Digunakan oleh ${row.blockers}. Nonaktifkan Wilayah Ini Jika Tidak Ingin Dipakai Lagi`,
        },
        400,
      );
    }

    rows.splice(rows.indexOf(row), 1);

    return json({
      status: 200,
      message: "Berhasil Menghapus Wilayah",
      data: view(row),
    });
  }

  return null;
};

/**
 * Tiruan be-sada `/role-jemaat`; jemaat dan bapel diambil dari ddl bersama.
 *
 *   MOCK_ROLE_SAVE_ERROR=validasi|overlap|jemaat|500 → simpan jabatan gagal dengan jawaban itu
 *                                         (tumpang tindih juga muncul alami: jemaat, bapel,
 *                                         dan nama jabatan sama dengan periode beririsan)
 *   MOCK_ROLE_DELETE_ERROR=1           → hapus jabatan menjawab 404 (sudah dihapus orang lain)
 *   MOCK_500=1                         → daftar jabatan menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { ddlRows } from "../../mock-dashboard";
import { denied, json, list, readBody, type MockHandler } from "../kit";

type Ref = { id: number; code: string; name: string };

type Role = {
  id: number;
  publicId: string;
  name: string;
  startPeriode: string;
  endPeriode: string;
  status: boolean;
  jemaat: Ref;
  bapel: Ref | null;
};

type Body = Partial<{
  name: unknown;
  startPeriode: unknown;
  endPeriode: unknown;
  status: unknown;
  jemaatId: unknown;
  bapelId: unknown;
}>;

const JEMAAT = (ddlRows("jemaat", new URLSearchParams()) ?? []) as Ref[];
const BAPEL = (ddlRows("bapel", new URLSearchParams()) ?? []) as Ref[];

const SEED: [number, number, string, string, string, boolean][] = [
  [0, 0, "Ketua", "2023-01-01", "2025-12-31", false],
  [1, 0, "Sekretaris", "2024-01-01", "2026-12-31", true],
  [2, 1, "Ketua", "2025-01-01", "2026-12-31", true],
  [3, 1, "Bendahara", "2025-01-01", "2026-12-31", true],
  [4, 3, "Koordinator Sekolah Minggu", "2025-07-01", "2027-06-30", true],
  [5, 2, "Ketua", "2026-01-01", "2028-12-31", true],
  [6, 1, "Wakil Ketua", "2026-01-01", "2028-12-31", true],
  [7, 2, "Sekretaris", "2024-01-01", "2025-12-31", false],
  [8, 4, "Pemimpin Pujian", "2026-03-01", "2027-02-28", true],
  [9, 5, "Koordinator Diakonia", "2026-01-01", "2027-12-31", true],
  [10, 0, "Penatua", "2026-01-01", "2030-12-31", true],
  [11, 4, "Pemain Keyboard", "2027-01-01", "2027-12-31", true],
];

const toInstant = (date: string) => `${date.slice(0, 10)}T00:00:00.000Z`;

let nextId = SEED.length + 1;

const rows: Role[] = (JEMAAT.length && BAPEL.length ? SEED : []).map(
  ([jemaat, bapel, name, start, end, status], index) => ({
    id: index + 1,
    publicId: `role-jemaat-${index + 1}`,
    name,
    startPeriode: toInstant(start),
    endPeriode: toInstant(end),
    status,
    jemaat: JEMAAT[jemaat],
    bapel: BAPEL[bapel],
  }),
);

const byStart = (a: Role, b: Role) =>
  a.startPeriode.localeCompare(b.startPeriode);

const isDate = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

function validate(body: Body) {
  const issues: { path: string; message: string }[] = [];
  const name = typeof body.name === "string" ? body.name.trim() : undefined;

  if (name === undefined) {
    issues.push({ path: "name", message: "Mohon Lengkapi Nama Role Jemaat" });
  } else if (name.length < 2) {
    issues.push({
      path: "name",
      message: "Nama Role Jemaat harus memiliki setidaknya 2 karakter",
    });
  } else if (name.length > 50) {
    issues.push({
      path: "name",
      message: "Nama Role Jemaat tidak boleh lebih dari 50 karakter",
    });
  }
  if (!isDate(body.startPeriode)) {
    issues.push({
      path: "startPeriode",
      message: "Mohon Lengkapi Tanggal Mulai Periode",
    });
  }
  if (!isDate(body.endPeriode)) {
    issues.push({
      path: "endPeriode",
      message: "Mohon Lengkapi Tanggal Akhir Periode",
    });
  }
  if (typeof body.status !== "boolean") {
    issues.push({ path: "status", message: "Invalid input: expected boolean" });
  }
  if (typeof body.jemaatId !== "number") {
    issues.push({ path: "jemaatId", message: "Mohon Lengkapi ID Jemaat" });
  }
  if (typeof body.bapelId !== "number") {
    issues.push({
      path: "bapelId",
      message: "Mohon Lengkapi ID Badan Pelayanan",
    });
  }
  if (
    issues.length === 0 &&
    Date.parse(String(body.endPeriode)) <= Date.parse(String(body.startPeriode))
  ) {
    issues.push({
      path: "endPeriode",
      message: "Tanggal Akhir Periode harus setelah Tanggal Mulai Periode",
    });
  }

  return issues;
}

const OVERLAP = {
  status: 409,
  error:
    "Jemaat tersebut sudah menjabat peran yang sama di Bapel ini pada periode yang bertumpang tindih",
};

const FORCED_ERROR: Record<
  string,
  {
    status: number;
    error: string;
    issues?: { path: string; message: string }[];
  }
> = {
  validasi: {
    status: 400,
    error: "Nama Role Jemaat harus memiliki setidaknya 2 karakter",
    issues: [
      {
        path: "name",
        message: "Nama Role Jemaat harus memiliki setidaknya 2 karakter",
      },
      {
        path: "endPeriode",
        message: "Tanggal Akhir Periode harus setelah Tanggal Mulai Periode",
      },
    ],
  },
  overlap: OVERLAP,
  jemaat: { status: 404, error: "Jemaat Tidak Ditemukan" },
  "500": { status: 500, error: "Kesalahan server." },
};

const notFound = () =>
  json({ status: 404, error: "Role Jemaat Tidak Ditemukan" }, 404);

const toRaw = ({ jemaat, bapel, ...role }: Role) => ({
  ...role,
  jemaatId: jemaat.id,
  bapelId: bapel?.id ?? null,
});

// `current` null = PUT ke id yang tidak ada; be-sada memvalidasi badan dulu, baru 404.
async function save(request: Request, current?: Role | null) {
  const forced = FORCED_ERROR[process.env.MOCK_ROLE_SAVE_ERROR ?? ""];

  if (forced) return json(forced, forced.status);

  const body = await readBody<Body>(request);
  const issues = validate(body);

  if (issues.length > 0) {
    return json({ status: 400, error: issues[0].message, issues }, 400);
  }
  if (current === null) return notFound();

  const jemaat = JEMAAT.find((ref) => ref.id === body.jemaatId);
  if (!jemaat)
    return json({ status: 404, error: "Jemaat Tidak Ditemukan" }, 404);

  const bapel = BAPEL.find((ref) => ref.id === body.bapelId);
  if (!bapel) return json({ status: 404, error: "Bapel Tidak Ditemukan" }, 404);

  const id = current?.id ?? nextId++;
  const next: Role = {
    id,
    publicId: current?.publicId ?? `role-jemaat-${id}`,
    name: String(body.name).trim(),
    startPeriode: toInstant(String(body.startPeriode)),
    endPeriode: toInstant(String(body.endPeriode)),
    status: Boolean(body.status),
    jemaat,
    bapel,
  };

  const isOverlap = rows.some(
    (row) =>
      row.id !== next.id &&
      row.jemaat.id === jemaat.id &&
      row.bapel?.id === bapel.id &&
      row.name.toLowerCase() === next.name.toLowerCase() &&
      row.startPeriode < next.endPeriode &&
      next.startPeriode < row.endPeriode,
  );
  if (isOverlap) return json(OVERLAP, 409);

  if (current) rows.splice(rows.indexOf(current), 1, next);
  else rows.push(next);

  const data = toRaw(next);

  return current
    ? json({ status: 200, message: "Berhasil Memperbarui Role Jemaat", data })
    : json({ status: 201, message: "Berhasil Membuat Role Jemaat", data }, 201);
}

export const roleJemaatMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path === "/role-jemaat") {
    if (method === "POST") {
      return can(MENU.ROLE_JEMAAT, "CREATE") ? save(request) : denied();
    }
    if (!can(MENU.ROLE_JEMAAT, "VIEW")) return denied();
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const year = url.searchParams.get("year");
    const matched = rows
      .filter(
        (row) =>
          !filter ||
          row.name.toLowerCase().includes(filter) ||
          row.jemaat.name.toLowerCase().includes(filter),
      )
      .filter((row) => !year || row.startPeriode.startsWith(year))
      .sort(byStart);

    return list(matched, url, "Role Jemaat", "Role Jemaat");
  }

  const match = path.match(/^\/role-jemaat\/([^/]+)$/);
  if (!match) return null;

  const row = rows.find((item) => String(item.id) === match[1]);
  if (method === "PUT") {
    if (!can(MENU.ROLE_JEMAAT, "UPDATE")) return denied();
    return save(request, row ?? null);
  }
  if (method === "DELETE") {
    if (!can(MENU.ROLE_JEMAAT, "DELETE")) return denied();
    if (!row || process.env.MOCK_ROLE_DELETE_ERROR) return notFound();

    rows.splice(rows.indexOf(row), 1);
    return json({
      status: 200,
      message: "Berhasil Menghapus Role Jemaat",
      data: toRaw(row),
    });
  }

  if (!can(MENU.ROLE_JEMAAT, "VIEW")) return denied();
  return row
    ? json({
        status: 200,
        message: "Berhasil Mendapatkan Role Jemaat",
        data: row,
      })
    : notFound();
};

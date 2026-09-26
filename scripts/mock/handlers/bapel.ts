/**
 * Tiruan `/api/v1/bapel` (be-sada `modules/bapel`).
 *
 *   MOCK_500=1                   → daftar bapel menjawab 500
 *   MOCK_BAPEL_MANY=1            → 45 bapel (5 halaman)
 *   MOCK_BAPEL_SAVE_ERROR=500    → simpan (POST/PUT) menjawab 500
 *
 * Nama yang sudah dipakai → 404 "Bapel Sudah Tersedia" (seperti be-sada).
 * BPL-0001 masih terhubung ke Pelayan dan Jadwal Pelayan, jadi hapusnya 400.
 */
import { MENU } from "../../../src/config/menu";
import { denied, json, list, readBody, type MockHandler } from "../kit";

type RuleType = "NO_DAY" | "NO_DATE" | "NO_WEEK" | "NO_TIME";

type RuleInput = {
  type: RuleType;
  dayOfWeek?: number;
  date?: string;
  weekOfMonth?: number;
  startTime?: string;
  endTime?: string;
};

type Row = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  rules: ReturnType<typeof toRuleRows>;
  blockers: string;
};

let ruleId = 0;

const toRuleRows = (rules: RuleInput[]) =>
  rules.map((rule) => {
    ruleId += 1;

    return {
      id: ruleId,
      publicId: `rule-${ruleId}`,
      type: rule.type,
      dayOfWeek: rule.dayOfWeek ?? null,
      date: rule.date ? `${rule.date.slice(0, 10)}T00:00:00.000Z` : null,
      startTime: rule.startTime ?? null,
      endTime: rule.endTime ?? null,
      weekOfMonth: rule.weekOfMonth ?? null,
    };
  });

const SEED: [string, RuleInput[], string?][] = [
  [
    "Komisi Pemuda",
    [
      { type: "NO_DAY", dayOfWeek: 0 },
      { type: "NO_TIME", startTime: "07:00", endTime: "09:00" },
    ],
    "Pelayan, Jadwal Pelayan",
  ],
  ["Komisi Anak", [{ type: "NO_DAY", dayOfWeek: 0 }]],
  ["Komisi Wanita", [{ type: "NO_WEEK", weekOfMonth: 2 }]],
  ["Komisi Pria", []],
  ["Paduan Suara", [{ type: "NO_DATE", date: "2026-12-25" }]],
  ["Multimedia", [{ type: "NO_WEEK", weekOfMonth: -1 }]],
  ["Komisi Lansia", []],
  ["Diakonia", [{ type: "NO_TIME", startTime: "16:00", endTime: "18:00" }]],
];

const rows: Row[] = (
  process.env.MOCK_BAPEL_MANY
    ? Array.from({ length: 45 }, (_, index): [string, RuleInput[]] => [
        `Komisi ${index + 1}`,
        [],
      ])
    : SEED
).map(([name, rules, blockers], index) => ({
  id: index + 1,
  publicId: `bapel-${index + 1}`,
  code: `BPL-${String(index + 1).padStart(4, "0")}`,
  name,
  rules: toRuleRows(rules),
  blockers: blockers ?? "",
}));

const view = ({ blockers: _blockers, ...row }: Row) => row;

const findRow = (code: string) =>
  rows.find((row) => row.code.toLowerCase() === code.toLowerCase());

const invalid = (path: string, message: string) =>
  json({ status: 400, error: message, issues: [{ path, message }] }, 400);

const validate = (body: { name?: string; rules?: RuleInput[] }) => {
  const name = body.name?.trim() ?? "";

  if (!body.name) return invalid("name", "Mohon Lengkapi Nama Bapel");
  if (name.length < 4) {
    return invalid("name", "Nama Bapel harus memiliki setidaknya 4 karakter");
  }
  if (name.length > 25) {
    return invalid("name", "Nama Bapel tidak boleh lebih dari 25 karakter");
  }

  const index = (body.rules ?? []).findIndex(
    (rule) =>
      rule.type === "NO_TIME" && (rule.endTime ?? "") <= (rule.startTime ?? ""),
  );

  if (index !== -1) {
    return invalid(
      `rules.${index}.endTime`,
      "Sampai Waktu harus lebih besar dari Dari Waktu",
    );
  }

  const keys = (body.rules ?? []).map((rule) => JSON.stringify(rule));

  if (new Set(keys).size !== keys.length) {
    return json(
      { status: 409, error: "Data yang Anda masukkan sudah digunakan" },
      409,
    );
  }

  return null;
};

const isNameTaken = (name: string, ownId?: number) =>
  rows.some((row) => row.name === name.trim() && row.id !== ownId);

export const bapelMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/bapel" && !path.startsWith("/bapel/")) return null;

  const code = path.match(/^\/bapel\/([^/]+)$/)?.[1];
  const action =
    method === "POST"
      ? "CREATE"
      : method === "PUT"
        ? "UPDATE"
        : method === "DELETE"
          ? "DELETE"
          : "VIEW";

  if (!can(MENU.BAPEL, action)) return denied();

  if (
    (method === "POST" || method === "PUT") &&
    process.env.MOCK_BAPEL_SAVE_ERROR === "500"
  ) {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/bapel" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

    return list(
      rows.filter((row) => row.name.toLowerCase().includes(filter)).map(view),
      url,
      "Bapel",
      "Bapel",
    );
  }

  if (path === "/bapel" && method === "POST") {
    const body = await readBody<{ name?: string; rules?: RuleInput[] }>(
      request,
    );
    const failure = validate(body);
    if (failure) return failure;

    if (isNameTaken(body.name ?? "")) {
      return json({ status: 404, error: "Bapel Sudah Tersedia" }, 404);
    }

    const id = Math.max(0, ...rows.map((item) => item.id)) + 1;
    const row: Row = {
      id,
      publicId: `bapel-${id}`,
      code: `BPL-${String(id).padStart(4, "0")}`,
      name: (body.name ?? "").trim(),
      rules: toRuleRows(body.rules ?? []),
      blockers: "",
    };

    rows.push(row);

    return json(
      { status: 201, message: "Berhasil Membuat Bapel", data: view(row) },
      201,
    );
  }

  const row = code ? findRow(code) : undefined;

  if (!row) return json({ status: 404, error: "Bapel Tidak Ditemukan" }, 404);

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Bapel",
      data: view(row),
    });
  }

  if (method === "PUT") {
    const body = await readBody<{ name?: string; rules?: RuleInput[] }>(
      request,
    );
    const failure = validate(body);
    if (failure) return failure;

    if (
      row.name !== body.name?.trim() &&
      isNameTaken(body.name ?? "", row.id)
    ) {
      return json({ status: 404, error: "Bapel Sudah Tersedia" }, 404);
    }

    row.name = (body.name ?? "").trim();
    row.rules = toRuleRows(body.rules ?? []);

    return json({
      status: 200,
      message: "Berhasil Memperbarui Bapel",
      data: view(row),
    });
  }

  if (method === "DELETE") {
    if (row.blockers) {
      return json(
        {
          status: 400,
          error: `Bapel Tidak Dapat Dihapus Karena Masih Terhubung dengan ${row.blockers}`,
        },
        400,
      );
    }

    rows.splice(rows.indexOf(row), 1);

    return json({
      status: 200,
      message: "Berhasil Menghapus Bapel",
      data: view(row),
    });
  }

  return null;
};

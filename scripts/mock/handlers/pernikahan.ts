/**
 * Tiruan be-sada `/marriage` (modules/marriage) dan `/ddl/jemaat`.
 *
 *   MOCK_500=1                          → daftar pernikahan menjawab 500
 *   MOCK_MARRIAGE_SAVE_ERROR=suami|istri|masih|validasi|500
 *                                       → simpan pernikahan gagal dengan jawaban itu
 *   MOCK_MARRIAGE_DELETE_ERROR=1        → hapus pernikahan menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { denied, json, list, readBody, type MockHandler } from "../kit";

type Party = { code: string; name: string };

type Row = {
  id: number;
  publicId: string;
  husbandJemaat: Party | null;
  husbandName: string | null;
  wifeJemaat: Party | null;
  wifeName: string | null;
  marriedAt: string | null;
  marriedPlace: string | null;
  blessedHere: boolean;
  endedAt: string | null;
  endReason: string | null;
  endNote: string | null;
};

type Body = Record<string, unknown>;

// Sama dengan NAMES di scripts/dev-mock.ts: kode JMT-0001 … JMT-0012.
const JEMAAT: Party[] = [
  "Andreas Sitanggang",
  "Bethari Ayu Kusuma",
  "Christian Wijaya",
  "Debora Manurung",
  "Eleazar Panggabean",
  "Fransiska Halim",
  "Gideon Tampubolon",
  "Hanna Simorangkir",
  "Immanuel Saragih",
  "Josephine Tanuwijaya",
  "Kevin Nainggolan",
  "Lidya Hutagalung",
].map((name, index) => ({
  code: `JMT-${String(index + 1).padStart(4, "0")}`,
  name,
}));

const jemaat = (code: string) => JEMAAT.find((row) => row.code === code);

const uuid = (id: number) =>
  `6f1c2a3e-0000-4000-8000-${String(id).padStart(12, "0")}`;

const seed = (
  id: number,
  row: Omit<Row, "id" | "publicId" | "endedAt" | "endReason" | "endNote"> &
    Partial<Row>,
): Row => ({
  id,
  publicId: uuid(id),
  endedAt: null,
  endReason: null,
  endNote: null,
  ...row,
});

const rows: Row[] = [
  seed(1, {
    husbandJemaat: jemaat("JMT-0001")!,
    husbandName: null,
    wifeJemaat: jemaat("JMT-0002")!,
    wifeName: null,
    marriedAt: "2012-06-16T00:00:00.000Z",
    marriedPlace: "GKI Sada, Bandung",
    blessedHere: true,
  }),
  seed(2, {
    husbandJemaat: jemaat("JMT-0003")!,
    husbandName: null,
    wifeJemaat: null,
    wifeName: "Ruth Anggraini Siregar",
    marriedAt: "2018-09-08T00:00:00.000Z",
    marriedPlace: "HKBP Menteng, Jakarta",
    blessedHere: false,
  }),
  seed(3, {
    husbandJemaat: jemaat("JMT-0005")!,
    husbandName: null,
    wifeJemaat: jemaat("JMT-0004")!,
    wifeName: null,
    marriedAt: "1998-02-21T00:00:00.000Z",
    marriedPlace: null,
    blessedHere: true,
    endedAt: "2021-11-03T00:00:00.000Z",
    endReason: "CERAI_MATI",
    endNote: "Suami berpulang",
  }),
  seed(4, {
    husbandJemaat: null,
    husbandName: "Samuel Hendrawan Pakpahan",
    wifeJemaat: jemaat("JMT-0006")!,
    wifeName: null,
    marriedAt: null,
    marriedPlace: null,
    blessedHere: false,
  }),
  seed(5, {
    husbandJemaat: jemaat("JMT-0007")!,
    husbandName: null,
    wifeJemaat: jemaat("JMT-0008")!,
    wifeName: null,
    marriedAt: "2023-05-20T00:00:00.000Z",
    marriedPlace: "GKI Sada, Bandung",
    blessedHere: true,
  }),
];

let nextId = rows.length + 1;

const present = (row: Row) => ({
  id: row.publicId,
  husband: {
    jemaatCode: row.husbandJemaat?.code ?? null,
    name: row.husbandJemaat?.name ?? row.husbandName,
  },
  wife: {
    jemaatCode: row.wifeJemaat?.code ?? null,
    name: row.wifeJemaat?.name ?? row.wifeName,
  },
  marriedAt: row.marriedAt,
  marriedPlace: row.marriedPlace,
  blessedHere: row.blessedHere,
  endedAt: row.endedAt,
  endReason: row.endReason,
  endNote: row.endNote,
});

const failure = (status: number, error: string) =>
  json({ status, error }, status);

const notFound = () => failure(404, "Pernikahan Tidak Ditemukan");

const blankToNull = (value: unknown) =>
  value === undefined || value === null || value === "" ? null : value;

const isDate = (value: unknown) =>
  typeof value === "string" && !Number.isNaN(new Date(value).getTime());

const toDate = (value: string) => `${value.slice(0, 10)}T00:00:00.000Z`;

const invalid = (issues: { path: string; message: string }[]) =>
  json({ status: 400, error: issues[0].message, issues }, 400);

const validateMarriage = (body: Body) => {
  const issues: { path: string; message: string }[] = [];

  for (const [side, label] of [
    ["husband", "Suami"],
    ["wife", "Istri"],
  ] as const) {
    const code = blankToNull(body[`${side}JemaatCode`]);
    const name = blankToNull(body[`${side}Name`]);
    const path = `${side}JemaatCode`;

    if (code && name) {
      issues.push({
        path,
        message: `Isi salah satu saja untuk ${label}: jemaat, atau nama`,
      });
    }
    if (!code && !name) {
      issues.push({ path, message: `Mohon Lengkapi ${label}` });
    }
  }

  const husbandCode = blankToNull(body.husbandJemaatCode);
  if (husbandCode && husbandCode === blankToNull(body.wifeJemaatCode)) {
    issues.push({
      path: "wifeJemaatCode",
      message: "Suami dan Istri tidak boleh jemaat yang sama",
    });
  }

  if (body.marriedAt !== undefined && body.marriedAt !== null) {
    if (!isDate(body.marriedAt)) {
      issues.push({
        path: "marriedAt",
        message: "Tanggal Menikah harus berupa tanggal yang valid",
      });
    }
  }

  return issues;
};

const SAVE_ERROR: Record<string, () => Response> = {
  suami: () => failure(404, "Suami Tidak Ditemukan"),
  istri: () => failure(404, "Istri Tidak Ditemukan"),
  masih: () =>
    failure(
      400,
      "Andreas Sitanggang Masih Tercatat Dalam Pernikahan Yang Belum Berakhir. Akhiri Pernikahan Tersebut Terlebih Dahulu",
    ),
  validasi: () =>
    invalid([{ path: "husbandJemaatCode", message: "Mohon Lengkapi Suami" }]),
  500: () => failure(500, "Kesalahan server."),
};

const resolveParty = (
  body: Body,
  side: "husband" | "wife",
  label: string,
  ownId?: number,
): Response | { jemaat: Party | null; name: string | null } => {
  const code = blankToNull(body[`${side}JemaatCode`]) as string | null;

  if (!code) {
    return { jemaat: null, name: blankToNull(body[`${side}Name`]) as string };
  }

  const found = jemaat(code);
  if (!found) return failure(404, `${label} Tidak Ditemukan`);

  const live = rows.find(
    (row) =>
      row.id !== ownId &&
      !row.endedAt &&
      (row.husbandJemaat?.code === code || row.wifeJemaat?.code === code),
  );
  if (live) {
    return failure(
      400,
      `${found.name} Masih Tercatat Dalam Pernikahan Yang Belum Berakhir. Akhiri Pernikahan Tersebut Terlebih Dahulu`,
    );
  }

  return { jemaat: found, name: null };
};

const writeResult = (row: Row) => ({
  publicId: row.publicId,
  husbandName: row.husbandName,
  wifeName: row.wifeName,
  marriedAt: row.marriedAt,
  marriedPlace: row.marriedPlace,
  blessedHere: row.blessedHere,
  endedAt: row.endedAt,
  endReason: row.endReason,
  endNote: row.endNote,
  husbandJemaat: row.husbandJemaat,
  wifeJemaat: row.wifeJemaat,
});

const saveMarriage = async (
  request: Request,
  existing?: Row,
): Promise<Response> => {
  const forced = SAVE_ERROR[process.env.MOCK_MARRIAGE_SAVE_ERROR ?? ""];
  if (forced) return forced();

  const body = await readBody<Body>(request);
  const issues = validateMarriage(body);
  if (issues.length) return invalid(issues);

  const husband = resolveParty(body, "husband", "Suami", existing?.id);
  if (husband instanceof Response) return husband;
  const wife = resolveParty(body, "wife", "Istri", existing?.id);
  if (wife instanceof Response) return wife;

  const marriedAt = blankToNull(body.marriedAt) as string | null;
  const fields = {
    husbandJemaat: husband.jemaat,
    husbandName: husband.name,
    wifeJemaat: wife.jemaat,
    wifeName: wife.name,
    marriedAt: marriedAt ? toDate(marriedAt) : null,
    marriedPlace: blankToNull(body.marriedPlace) as string | null,
    blessedHere: body.blessedHere === true,
  };

  if (existing) {
    Object.assign(existing, fields);

    return json({
      status: 200,
      message: "Berhasil Memperbarui Pernikahan",
      data: writeResult(existing),
    });
  }

  const row = seed(nextId++, fields);
  rows.push(row);

  return json(
    {
      status: 201,
      message: "Berhasil Mencatat Pernikahan",
      data: writeResult(row),
    },
    201,
  );
};

const endMarriage = async (request: Request, row: Row): Promise<Response> => {
  const body = await readBody<Body>(request);
  const issues: { path: string; message: string }[] = [];

  if (!isDate(body.endedAt)) {
    issues.push({
      path: "endedAt",
      message: "Tanggal Berakhir harus berupa tanggal yang valid",
    });
  }
  if (body.endReason !== "CERAI_HIDUP" && body.endReason !== "CERAI_MATI") {
    issues.push({
      path: "endReason",
      message: "Alasan Berakhir harus bernilai Cerai Hidup atau Cerai Mati",
    });
  }
  if (issues.length) return invalid(issues);
  if (row.endedAt) return failure(400, "Pernikahan Ini Sudah Berakhir");

  row.endedAt = toDate(body.endedAt as string);
  row.endReason = body.endReason as string;
  row.endNote = blankToNull(body.endNote) as string | null;

  return json({
    status: 200,
    message: "Berhasil Mengakhiri Pernikahan",
    data: writeResult(row),
  });
};

const listMarriage = (url: URL) => {
  if (process.env.MOCK_500) return failure(500, "Kesalahan server.");

  const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
  const status = url.searchParams.get("status");

  const matched = rows
    .filter((row) => {
      const view = present(row);
      const isMatch =
        !filter ||
        [view.husband.name, view.wife.name].some((name) =>
          name?.toLowerCase().includes(filter),
        );

      if (status === "AKTIF" && row.endedAt) return false;
      if (status === "BERAKHIR" && !row.endedAt) return false;

      return isMatch;
    })
    .sort(
      (a, b) =>
        Number(Boolean(a.endedAt)) - Number(Boolean(b.endedAt)) || b.id - a.id,
    )
    .map(present);

  return list(matched, url, "Pernikahan", "Pernikahan");
};

// be-sada: GET /ddl/jemaat tidak mengizinkan PERNIKAHAN (gap di brief).
const DDL_JEMAAT_GUARD = [
  MENU.DAFTAR_JEMAAT,
  MENU.KARYAWAN,
  MENU.PEMINJAMAN_RUANG,
  MENU.DAFTAR_PELAYAN,
  MENU.ROLE_JEMAAT,
  MENU.USER,
] as const;

export const pernikahanMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path === "/ddl/jemaat") {
    if (!DDL_JEMAAT_GUARD.some((slug) => can(slug, "VIEW"))) return denied();

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
    const limit = Number(url.searchParams.get("limit")) || JEMAAT.length;
    const data = JEMAAT.filter(
      (row) =>
        row.name.toLowerCase().includes(filter) ||
        row.code.toLowerCase().includes(filter),
    )
      .slice(0, limit)
      .map((row, index) => ({ id: index + 1, ...row }));

    if (data.length === 0 || process.env.MOCK_DDL_EMPTY) {
      return failure(404, "Data Tidak Ditemukan");
    }

    return json({ status: 200, message: "Berhasil Mendapatkan Data", data });
  }

  if (path !== "/marriage" && !path.startsWith("/marriage/")) return null;

  const [, , publicId, action] = path.split("/");
  const row = rows.find((item) => item.publicId === publicId);

  if (!publicId) {
    if (method === "GET") {
      return can(MENU.PERNIKAHAN, "VIEW") ? listMarriage(url) : denied();
    }
    if (method === "POST") {
      return can(MENU.PERNIKAHAN, "CREATE") ? saveMarriage(request) : denied();
    }
    return null;
  }

  if (action === "end" && method === "PUT") {
    if (!can(MENU.PERNIKAHAN, "UPDATE")) return denied();

    return row ? endMarriage(request, row) : notFound();
  }

  if (method === "GET") {
    if (!can(MENU.PERNIKAHAN, "VIEW")) return denied();

    return row
      ? json({
          status: 200,
          message: "Berhasil Mendapatkan Pernikahan",
          data: present(row),
        })
      : notFound();
  }

  if (method === "PUT") {
    if (!can(MENU.PERNIKAHAN, "UPDATE")) return denied();

    return row ? saveMarriage(request, row) : notFound();
  }

  if (method === "DELETE") {
    if (!can(MENU.PERNIKAHAN, "DELETE")) return denied();
    if (!row) return notFound();
    if (process.env.MOCK_MARRIAGE_DELETE_ERROR) {
      return failure(500, "Kesalahan server.");
    }

    rows.splice(rows.indexOf(row), 1);

    return json({
      status: 200,
      message: "Berhasil Menghapus Pernikahan",
      data: writeResult(row),
    });
  }

  return null;
};
